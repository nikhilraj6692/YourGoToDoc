package com.mediconnect.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Message {
    private String id;
    private String chatId;
    private String senderId;
    private String content;
    private String type; // TEXT, IMAGE, DOCUMENT
    private List<String> readBy; // List of user IDs who have read the message
    private LocalDateTime createdAt;
} 