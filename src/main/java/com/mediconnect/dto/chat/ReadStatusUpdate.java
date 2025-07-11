package com.mediconnect.dto.chat;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadStatusUpdate {
    
    private String type = "READ_STATUS_UPDATE";
    private String appointmentId;
    private String readByUserId;
    private List<String> messageIds; // IDs of messages that were marked as read
    private long timestamp;
    
    public static ReadStatusUpdate create(String appointmentId, String readByUserId, List<String> messageIds) {
        return ReadStatusUpdate.builder()
                .type("READ_STATUS_UPDATE")
                .appointmentId(appointmentId)
                .readByUserId(readByUserId)
                .messageIds(messageIds)
                .timestamp(System.currentTimeMillis())
                .build();
    }
} 