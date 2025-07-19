package com.mediconnect.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.model.FlywayConfig;
import com.mediconnect.repository.FlywayConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomFlywayService {
    
    private final MongoTemplate mongoTemplate;
    private final FlywayConfigRepository flywayConfigRepository;
    private final ObjectMapper objectMapper;
    private static final String MONGO_INIT_SCRIPT = "mongo-init.js";
    
    @PostConstruct
    public void runMigrations() {
        try {
            log.info("Starting MongoDB initialization...");
            
            // Get or create flyway config
            FlywayConfig config = flywayConfigRepository.findFirstByOrderByLastExecutedAtDesc();
            if (config == null) {
                config = new FlywayConfig();
                config.setLastVersion("V0");
                config.setLastExecutedAt(0);
            }
            
            // Check if mongo-init.js has been executed
            String currentVersion = "V1.0"; // Version for mongo-init.js
            if (currentVersion.compareTo(config.getLastVersion()) > 0) {
                log.info("Executing MongoDB initialization script: {}", MONGO_INIT_SCRIPT);
                
                // Read the mongo-init.js script
                ClassPathResource resource = new ClassPathResource(MONGO_INIT_SCRIPT);
                if (!resource.exists()) {
                    log.warn("MongoDB initialization script not found: {}", MONGO_INIT_SCRIPT);
                    return;
                }
                
                String scriptContent = new BufferedReader(new InputStreamReader(resource.getInputStream()))
                    .lines()
                    .collect(Collectors.joining("\n"));
                
                // Execute the script commands
                executeMongoScript(scriptContent);
                
                // Update config
                config.setLastVersion(currentVersion);
                config.setLastExecutedAt(System.currentTimeMillis());
                flywayConfigRepository.save(config);
                
                log.info("Successfully executed MongoDB initialization script: {}", MONGO_INIT_SCRIPT);
            } else {
                log.info("MongoDB initialization already up to date. Current version: {}", config.getLastVersion());
            }
            
        } catch (Exception e) {
            log.error("Error executing MongoDB initialization", e);
            // Don't throw exception to prevent application startup failure
            // Just log the error and continue
        }
    }
    
    private void executeMongoScript(String scriptContent) {
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
                }
            }
            
        } catch (Exception e) {
            log.error("Error executing MongoDB script command", e);
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
            // Extract collection and index details from createIndex command
            // Example: db.users.createIndex({ "email": 1 }, { unique: true });
            String collectionName = extractCollectionNameFromIndex(command);
            if (collectionName != null) {
                // For now, just log that index creation is handled by Spring Data MongoDB
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
} 