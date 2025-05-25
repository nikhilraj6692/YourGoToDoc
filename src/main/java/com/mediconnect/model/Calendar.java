package com.mediconnect.model;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Calendar {
    private String id;
    private String doctorId;
    private LocalDate date;
    private List<Slot> slots;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class Slot {
        private String id;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private boolean isAvailable;
        private String appointmentId; // null if slot is available
    }
} 