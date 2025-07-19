package com.mediconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.index.GeospatialIndex;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.PostConstruct;

@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.mediconnect.repository")
public class MongoConfig {
    // MongoDB configuration is handled by Spring Boot's auto-configuration
    // based on application-local.yml/yml settings

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void initIndexes() {
        // Create geospatial index for Address.location
        mongoTemplate.indexOps("doctor_profiles").ensureIndex(
            new GeospatialIndex("location")
                .typed(GeoSpatialIndexType.GEO_2DSPHERE)
        );
    }
} 