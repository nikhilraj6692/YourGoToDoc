package com.mediconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "chat_rooms")
public class ChatRoom {
    
    @Id
    @Indexed(unique = true)
    private String appointmentId;
    
    private String patientId;
    private String doctorId;
    private LocalDateTime createdAt;
    private LocalDateTime lastActivity;
    private boolean isActive;
    private int messageCount;
    
    // Transient field for active WebSocket sessions (not persisted)
    @Builder.Default
    private transient Map<String, Object> activeSessions = new ConcurrentHashMap<>();
    
    public void updateLastActivity() {
        this.lastActivity = LocalDateTime.now();
        this.isActive = true;
    }
    
    public boolean isInactive() {
        return lastActivity == null || 
               LocalDateTime.now().minusMinutes(5).isAfter(lastActivity);
    }
    
    public void incrementMessageCount() {
        this.messageCount++;
        updateLastActivity();
    }
    
    public void addSession(String sessionId, Object session) {
        activeSessions.put(sessionId, session);
        updateLastActivity();
    }
    
    public void removeSession(String sessionId) {
        activeSessions.remove(sessionId);
    }
    
    public boolean hasActiveSessions() {
        return !activeSessions.isEmpty();
    }
    
    public int getActiveSessionCount() {
        return activeSessions.size();
    }
} 