package com.mediconnect.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.index.GeospatialIndex;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import jakarta.annotation.PostConstruct;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.mediconnect.repository")
public class MongoConfig {
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @PostConstruct
    public void initIndexes(@Lazy MongoTemplate mongoTemplate) {
        // Create geospatial index for Address.location
        mongoTemplate.indexOps("doctor_profiles").ensureIndex(
            new GeospatialIndex("location")
                .typed(GeoSpatialIndexType.GEO_2DSPHERE)
        );
    }

    @Bean
    public MongoClientSettings mongoClientSettings() {
        ConnectionString connectionString = new ConnectionString(mongoUri);

        return MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .applyToConnectionPoolSettings(builder ->
                        builder.maxSize(10)                    // Limit connections
                                .minSize(1)                     // Minimum connections
                                .maxConnectionIdleTime(60, TimeUnit.SECONDS)
                                .maxConnectionLifeTime(120, TimeUnit.SECONDS)
                )
                .build();
    }

} 