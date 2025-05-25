package com.mediconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.mediconnect.repository")
public class MongoConfig {
    // MongoDB configuration is handled by Spring Boot's auto-configuration
    // based on application.properties/yml settings
} 