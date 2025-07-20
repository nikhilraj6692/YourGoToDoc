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
        try {
            // Clean up invalid location data first
            cleanupInvalidLocationData(mongoTemplate);

            // Drop existing geospatial index if it exists
            try {
                mongoTemplate.indexOps("doctor_profiles").dropIndex("location_2dsphere");
                System.out.println("✅ Dropped existing geospatial index");
            } catch (Exception e) {
                System.out.println("ℹ️ No existing geospatial index to drop");
            }

            // Create new geospatial index for Address.location
            mongoTemplate.indexOps("doctor_profiles").ensureIndex(
                    new GeospatialIndex("location")
                            .typed(GeoSpatialIndexType.GEO_2DSPHERE)
            );
            System.out.println("✅ Geospatial index created successfully");
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Could not create geospatial index: " + e.getMessage());
            System.err.println("This might be due to existing data with incorrect location format");
            System.err.println("Consider cleaning up location data in the database");
        }
    }

    private void cleanupInvalidLocationData(MongoTemplate mongoTemplate) {
        try {
            // Remove documents with invalid location format
            org.springframework.data.mongodb.core.query.Query query =
                    new org.springframework.data.mongodb.core.query.Query();
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria
                    .where("location").exists(true)
                    .and("location.type").exists(false));

            long count = mongoTemplate.count(query, "doctor_profiles");
            if (count > 0) {
                System.out.println("⚠️ Found " + count + " documents with invalid location format");
                System.out.println("ℹ️ These documents will be skipped for geospatial queries");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error checking location data: " + e.getMessage());
        }
    }

} 