package com.mediconnect.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class Notification {
    private String id;
    private String userId;
    private String eventName;
    private String type; // EMAIL, SMS, IN_APP
    private String title;
    private String message;
    private Map<String, Object> metadata;
    private String status; // PENDING, SENT, FAILED
    private LocalDateTime scheduledFor;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private String relatedId;
    private Long readAt;
} 