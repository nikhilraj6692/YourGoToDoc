package com.mediconnect.dto.chat;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPresenceUpdate {
    
    private String type = "USER_PRESENCE_UPDATE";
    private String appointmentId;
    private String userId;
    private String userRole; // "DOCTOR" or "PATIENT"
    @JsonProperty("isOnline")
    private boolean isOnline;
    private long timestamp;
    
    public static UserPresenceUpdate create(String appointmentId, String userId, String userRole, boolean isOnline) {
        return UserPresenceUpdate.builder()
                .type("USER_PRESENCE_UPDATE")
                .appointmentId(appointmentId)
                .userId(userId)
                .userRole(userRole)
                .isOnline(isOnline)
                .timestamp(System.currentTimeMillis())
                .build();
    }
} 