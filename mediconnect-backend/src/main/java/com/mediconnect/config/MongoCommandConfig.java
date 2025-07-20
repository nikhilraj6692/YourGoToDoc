package com.mediconnect.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.index.GeospatialIndex;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import jakarta.annotation.PostConstruct;

@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.mediconnect.repository")
public class MongoCommandConfig {
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