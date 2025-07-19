package com.mediconnect.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "flyway_config")
public class FlywayConfig {
    @Id
    private String id;
    private String lastVersion;
    private long lastExecutedAt;
} 