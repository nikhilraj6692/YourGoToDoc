package com.mediconnect.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.model.FlywayConfig;
import com.mediconnect.repository.FlywayConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomFlywayService {
    
    private final MongoTemplate mongoTemplate;
    private final FlywayConfigRepository flywayConfigRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;
    
    // Pattern to match migration script files: mongo-init-vX.Y.js
    private static final Pattern MIGRATION_PATTERN = Pattern.compile("mongo-init-v(\\d+\\.\\d+)\\.js");
    
    @PostConstruct
    public void runMigrations() {
        try {
            log.info("Starting MongoDB migrations...");
            
            // Get or create flyway config
            FlywayConfig config = flywayConfigRepository.findFirstByOrderByLastExecutedAtDesc();
            if (config == null) {
                config = new FlywayConfig();
                config.setLastVersion("V0");
                config.setLastExecutedAt(0);
            }
            
            String currentDbVersion = config.getLastVersion();
            log.info("Current database version: {}", currentDbVersion);
            
            // Discover available migration scripts
            List<MigrationScript> availableScripts = discoverMigrationScripts();
            log.info("Discovered {} migration scripts", availableScripts.size());
            
            // Find scripts that need to be executed
            List<MigrationScript> pendingScripts = availableScripts.stream()
                .filter(script -> script.version.compareTo(currentDbVersion) > 0)
                .sorted((s1, s2) -> s1.version.compareTo(s2.version))
                .collect(Collectors.toList());
            
            if (pendingScripts.isEmpty()) {
                log.info("Database is up to date. Current version: {}", currentDbVersion);
                return;
            }
            
            log.info("Found {} pending migration(s)", pendingScripts.size());
            
            // Execute pending scripts in order
            for (MigrationScript script : pendingScripts) {
                log.info("Executing migration script: {} (Version: {})", script.filename, script.version);
                
                // Execute the script using MongoDB shell
                boolean success = executeMongoScript(script.filename);
                
                if (success) {
                    // Update config with new version
                    config.setLastVersion(script.version);
                    config.setLastExecutedAt(System.currentTimeMillis());
                    flywayConfigRepository.save(config);
                    
                    log.info("Successfully executed migration script: {} (Version: {})", script.filename, script.version);
                } else {
                    log.error("Failed to execute migration script: {} (Version: {})", script.filename, script.version);
                    break; // Stop execution on failure
                }
            }
            
            log.info("All migrations completed successfully!");
            
        } catch (Exception e) {
            log.error("Error executing MongoDB migrations", e);
            // Don't throw exception to prevent application startup failure
            // Just log the error and continue
        }
    }
    
    private List<MigrationScript> discoverMigrationScripts() {
        List<MigrationScript> scripts = new ArrayList<>();
        
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:mongo-init-v*.js");
            
            for (Resource resource : resources) {
                String filename = resource.getFilename();
                if (filename != null) {
                    Matcher matcher = MIGRATION_PATTERN.matcher(filename);
                    if (matcher.matches()) {
                        String version = "V" + matcher.group(1);
                        scripts.add(new MigrationScript(filename, version));
                        log.debug("Discovered migration script: {} (Version: {})", filename, version);
                    }
                }
            }
            
            // Sort by version
            scripts.sort((s1, s2) -> s1.version.compareTo(s2.version));
            
        } catch (Exception e) {
            log.error("Error discovering migration scripts", e);
        }
        
        return scripts;
    }
    
    private boolean executeMongoScript(String scriptFilename) {
        try {
            // Read the script from classpath
            ClassPathResource resource = new ClassPathResource(scriptFilename);
            if (!resource.exists()) {
                log.error("Migration script not found: {}", scriptFilename);
                return false;
            }
            
            // Create a temporary file to execute
            Path tempDir = Files.createTempDirectory("mongo-migration");
            Path tempScript = tempDir.resolve(scriptFilename);
            
            // Copy script to temp file
            try (InputStream inputStream = resource.getInputStream();
                 FileOutputStream outputStream = new FileOutputStream(tempScript.toFile())) {
                byte[] buffer = new byte[1024];
                int length;
                while ((length = inputStream.read(buffer)) > 0) {
                    outputStream.write(buffer, 0, length);
                }
            }
            
            // Get MongoDB connection string from Spring configuration
            String connectionString = getMongoConnectionString();
            
            // Try mongosh first, then fallback to mongo
            boolean success = tryExecuteWithMongoSh(connectionString, tempScript.toString());
            if (!success) {
                log.info("mongosh not available, trying with mongo command...");
                success = tryExecuteWithMongo(connectionString, tempScript.toString());
            }
            
            // Clean up temp file
            Files.deleteIfExists(tempScript);
            Files.deleteIfExists(tempDir);
            
            return success;
            
        } catch (Exception e) {
            log.error("Error executing MongoDB script: {}", scriptFilename, e);
            return false;
        }
    }
    
    private boolean tryExecuteWithMongoSh(String connectionString, String scriptPath) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                "mongosh", 
                connectionString,
                "--file", scriptPath,
                "--quiet"
            );
            
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            // Read output
            String output = new java.util.Scanner(process.getInputStream()).useDelimiter("\\A").hasNext() ? 
                new java.util.Scanner(process.getInputStream()).useDelimiter("\\A").next() : "";
            
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                log.info("MongoDB script executed successfully with mongosh: {}", scriptPath);
                log.debug("Script output: {}", output);
                return true;
            } else {
                log.warn("mongosh failed with exit code {}: {}", exitCode, output);
                return false;
            }
            
        } catch (Exception e) {
            log.debug("mongosh not available: {}", e.getMessage());
            return false;
        }
    }
    
    private boolean tryExecuteWithMongo(String connectionString, String scriptPath) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                "mongo", 
                connectionString,
                scriptPath,
                "--quiet"
            );
            
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            // Read output
            String output = new java.util.Scanner(process.getInputStream()).useDelimiter("\\A").hasNext() ? 
                new java.util.Scanner(process.getInputStream()).useDelimiter("\\A").next() : "";
            
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                log.info("MongoDB script executed successfully with mongo: {}", scriptPath);
                log.debug("Script output: {}", output);
                return true;
            } else {
                log.error("mongo failed with exit code {}: {}", exitCode, output);
                return false;
            }
            
        } catch (Exception e) {
            log.error("mongo command also not available: {}", e.getMessage());
            return false;
        }
    }
    
    private String getMongoConnectionString() {
        try {
            // Use the Spring MongoDB URI configuration
            if (mongoUri != null && !mongoUri.trim().isEmpty()) {
                log.debug("Using MongoDB URI from Spring configuration: {}", mongoUri);
                return mongoUri;
            } else {
                log.warn("Spring MongoDB URI not configured, using default");
                return "mongodb://localhost:27017/mediconnect";
            }
            
        } catch (Exception e) {
            log.warn("Could not get MongoDB connection string from Spring configuration, using default", e);
            return "mongodb://localhost:27017/mediconnect";
        }
    }
    
    // Inner class to represent migration scripts
    private static class MigrationScript {
        final String filename;
        final String version;
        
        MigrationScript(String filename, String version) {
            this.filename = filename;
            this.version = version;
        }
    }
} 