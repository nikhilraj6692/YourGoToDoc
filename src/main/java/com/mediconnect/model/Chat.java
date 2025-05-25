package com.mediconnect.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Chat {
    private String id;
    private String appointmentId;
    private List<Participant> participants;
    private String status; // ACTIVE, INACTIVE
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class Participant {
        private String userId;
        private String role; // DOCTOR, PATIENT
    }
} 