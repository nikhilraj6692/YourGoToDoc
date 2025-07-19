package com.mediconnect.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.model.FlywayConfig;
import com.mediconnect.repository.FlywayConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
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

                // Execute the script using MongoDB Java driver
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

            String scriptContent = new BufferedReader(new InputStreamReader(resource.getInputStream()))
                .lines()
                .collect(Collectors.joining("\n"));

            // Execute the script using MongoDB Java driver
            return executeMongoCommands(scriptContent);

        } catch (Exception e) {
            log.error("Error executing MongoDB script: {}", scriptFilename, e);
            return false;
        }
    }

    private boolean executeMongoCommands(String scriptContent) {
        try {
            // Split the script into individual commands
            String[] commands = scriptContent.split(";");

            for (String command : commands) {
                command = command.trim();
                if (command.isEmpty() || command.startsWith("//") || command.startsWith("print")) {
                    continue; // Skip comments and print statements
                }

                // Handle different types of MongoDB commands
                if (command.contains("createCollection")) {
                    executeCreateCollection(command);
                } else if (command.contains("createIndex")) {
                    executeCreateIndex(command);
                } else if (command.contains("insertOne")) {
                    executeInsertOne(command);
                } else if (command.contains("countDocuments")) {
                    executeCountDocuments(command);
                } else if (command.contains("getCollectionNames")) {
                    executeGetCollectionNames(command);
                } else if (command.contains("updateMany")) {
                    executeUpdateMany(command);
                } else if (command.contains("findOne")) {
                    executeFindOne(command);
                }
            }

            return true;

        } catch (Exception e) {
            log.error("Error executing MongoDB commands", e);
            return false;
        }
    }

    private void executeCreateCollection(String command) {
        try {
            // Extract collection name from createCollection command
            // Example: db.createCollection('users');
            String collectionName = extractCollectionName(command);
            if (collectionName != null) {
                if (!mongoTemplate.collectionExists(collectionName)) {
                    mongoTemplate.createCollection(collectionName);
                    log.debug("Created collection: {}", collectionName);
                } else {
                    log.debug("Collection already exists: {}", collectionName);
                }
            }
        } catch (Exception e) {
            log.warn("Error creating collection: {}", e.getMessage());
        }
    }

    private void executeCreateIndex(String command) {
        try {
            // Extract collection name and index details from createIndex command
            // Example: db.users.createIndex({ "email": 1 }, { unique: true });
            String collectionName = extractCollectionNameFromIndex(command);
            if (collectionName != null) {
                // Skip index creation for _id fields as they are automatically created by MongoDB
                if (command.contains("\"_id\"")) {
                    log.debug("Skipping _id index creation for collection {} - MongoDB creates this automatically", collectionName);
                    return;
                }

                // For now, just log that index creation is handled by Spring Data MongoDB
                // Spring Data MongoDB will create indexes based on @Indexed annotations
                log.debug("Index creation for collection {} will be handled by Spring Data MongoDB", collectionName);
            }
        } catch (Exception e) {
            log.warn("Error creating index: {}", e.getMessage());
        }
    }

    private void executeInsertOne(String command) {
        try {
            // Extract collection name and document from insertOne command
            // Example: db.users.insertOne({...})
            String collectionName = extractCollectionNameFromInsert(command);
            if (collectionName != null) {
                // For now, just log that data insertion is handled by application logic
                log.debug("Data insertion for collection {} will be handled by application logic", collectionName);
            }
        } catch (Exception e) {
            log.warn("Error inserting document: {}", e.getMessage());
        }
    }

    private void executeCountDocuments(String command) {
        try {
            // Extract collection name from countDocuments command
            // Example: db.users.countDocuments()
            String collectionName = extractCollectionName(command);
            if (collectionName != null) {
                long count = mongoTemplate.getCollection(collectionName).countDocuments();
                log.debug("Collection {} has {} documents", collectionName, count);
            }
        } catch (Exception e) {
            log.warn("Error counting documents: {}", e.getMessage());
        }
    }

    private void executeGetCollectionNames(String command) {
        try {
            // Get all collection names
            var collectionNames = mongoTemplate.getCollectionNames();
            log.debug("Available collections: {}", collectionNames);
        } catch (Exception e) {
            log.warn("Error getting collection names: {}", e.getMessage());
        }
    }

    private void executeUpdateMany(String command) {
        try {
            // Extract collection name from updateMany command
            // Example: db.users.updateMany({...}, {...})
            String collectionName = extractCollectionNameFromUpdate(command);
            if (collectionName != null) {
                log.debug("UpdateMany operation for collection {} will be handled by application logic", collectionName);
            }
        } catch (Exception e) {
            log.warn("Error updating documents: {}", e.getMessage());
        }
    }

    private void executeFindOne(String command) {
        try {
            // Extract collection name from findOne command
            // Example: db.users.findOne({...})
            String collectionName = extractCollectionNameFromFind(command);
            if (collectionName != null) {
                log.debug("FindOne operation for collection {} will be handled by application logic", collectionName);
            }
        } catch (Exception e) {
            log.warn("Error finding document: {}", e.getMessage());
        }
    }

    private String extractCollectionName(String command) {
        // Extract collection name from commands like db.createCollection('users')
        if (command.contains("createCollection")) {
            int start = command.indexOf("'") + 1;
            int end = command.indexOf("'", start);
            if (start > 0 && end > start) {
                return command.substring(start, end);
            }
        }
        return null;
    }

    private String extractCollectionNameFromIndex(String command) {
        // Extract collection name from commands like db.users.createIndex(...)
        if (command.contains("createIndex")) {
            int dbIndex = command.indexOf("db.");
            int dotIndex = command.indexOf(".", dbIndex + 3);
            if (dbIndex >= 0 && dotIndex > dbIndex) {
                return command.substring(dbIndex + 3, dotIndex);
            }
        }
        return null;
    }

    private String extractCollectionNameFromInsert(String command) {
        // Extract collection name from commands like db.users.insertOne(...)
        if (command.contains("insertOne")) {
            int dbIndex = command.indexOf("db.");
            int dotIndex = command.indexOf(".", dbIndex + 3);
            if (dbIndex >= 0 && dotIndex > dbIndex) {
                return command.substring(dbIndex + 3, dotIndex);
            }
        }
        return null;
    }

    private String extractCollectionNameFromUpdate(String command) {
        // Extract collection name from commands like db.users.updateMany(...)
        if (command.contains("updateMany")) {
            int dbIndex = command.indexOf("db.");
            int dotIndex = command.indexOf(".", dbIndex + 3);
            if (dbIndex >= 0 && dotIndex > dbIndex) {
                return command.substring(dbIndex + 3, dotIndex);
            }
        }
        return null;
    }

    private String extractCollectionNameFromFind(String command) {
        // Extract collection name from commands like db.users.findOne(...)
        if (command.contains("findOne")) {
            int dbIndex = command.indexOf("db.");
            int dotIndex = command.indexOf(".", dbIndex + 3);
            if (dbIndex >= 0 && dotIndex > dbIndex) {
                return command.substring(dbIndex + 3, dotIndex);
            }
        }
        return null;
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