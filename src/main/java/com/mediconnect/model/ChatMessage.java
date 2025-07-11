package com.mediconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "chat_messages")
public class ChatMessage {
    
    @Id
    private String id;
    
    @Indexed
    private String appointmentId;
    
    private String senderId;
    private String senderType; // "PATIENT" or "DOCTOR"
    private String content;
    private MessageType type;
    private String fileUrl; // For attachments
    private LocalDateTime timestamp;
    private boolean isSent;
    private boolean isRead;
    private Set<String> readBy = new HashSet<>(); // Set of user IDs who read the message
    
    // File metadata
    private FileMetadata fileMetadata;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FileMetadata {
        private String fileName;
        private String mimeType;
        private Long fileSize;
        private String fileExtension;
    }
    
    public enum MessageType {
        TEXT, FILE, IMAGE, VOICE
    }
} 