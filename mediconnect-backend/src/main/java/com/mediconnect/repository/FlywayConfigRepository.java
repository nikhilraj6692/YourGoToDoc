package com.mediconnect.repository;

import com.mediconnect.model.FlywayConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FlywayConfigRepository extends MongoRepository<FlywayConfig, String> {
    FlywayConfig findFirstByOrderByLastExecutedAtDesc();
}