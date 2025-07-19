package com.mediconnect.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.model.FlywayConfig;
import com.mediconnect.repository.FlywayConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomFlywayService {
    
    private final MongoTemplate mongoTemplate;
    private final FlywayConfigRepository flywayConfigRepository;
    private final ObjectMapper objectMapper;
    private static final String SCRIPTS_LOCATION = "classpath:db/scripts/*.json";
    
    @PostConstruct
    public void runMigrations() {
        try {
            // Get or create flyway config
            FlywayConfig config = flywayConfigRepository.findFirstByOrderByLastExecutedAtDesc();
            if (config == null) {
                config = new FlywayConfig();
                config.setLastVersion("V0");
                config.setLastExecutedAt(0);
            }
            
            // Get all migration scripts
            Resource[] resources = new PathMatchingResourcePatternResolver().getResources(SCRIPTS_LOCATION);
            List<Resource> migrationScripts = Arrays.stream(resources)
                .filter(resource -> {
                    String filename = resource.getFilename();
                    return filename != null && filename.endsWith(".json");
                })
                .sorted(Comparator.comparing(Resource::getFilename))
                .collect(Collectors.toList());
            
            // Execute pending migrations
            for (Resource script : migrationScripts) {
                String version = script.getFilename().split("__")[0];
                if (version.compareTo(config.getLastVersion()) > 0) {
                    log.info("Executing migration: {}", script.getFilename());
                    
                    // Read and execute the script
                    String scriptContent = new BufferedReader(new InputStreamReader(script.getInputStream()))
                        .lines()
                        .collect(Collectors.joining("\n"));
                    
                    // Parse the JSON command into Document
                    Document command = Document.parse(scriptContent);
                    Document result = mongoTemplate.executeCommand(command);
                    
                    if(result != null && result.containsKey("writeErrors")) {
                        List<Document> writeErrors = (List<Document>) result.get("writeErrors");
                        String errorMessage = writeErrors.stream()
                            .map(error -> String.format("Error: %s, Code: %d", 
                                error.getString("errmsg"), 
                                error.getInteger("code")))
                            .collect(Collectors.joining(", "));
                        throw new RuntimeException("Migration failed: " + errorMessage);
                    }
                    
                    // Update config
                    config.setLastVersion(version);
                    config.setLastExecutedAt(System.currentTimeMillis());
                    flywayConfigRepository.save(config);
                    
                    log.info("Successfully executed migration: {}", script.getFilename());
                }
            }
        } catch (Exception e) {
            log.error("Error executing migrations", e);
            throw new RuntimeException("Failed to execute migrations: " + e.getMessage(), e);
        }
    }
} 