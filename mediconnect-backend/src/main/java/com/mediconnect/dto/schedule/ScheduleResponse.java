package com.mediconnect.dto.schedule;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ScheduleResponse {
    private List<TimeSlot> slots;

    @Data
    public static class TimeSlot {
        private String id;
        private String calendarId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private boolean isAvailable;
        private String patientName;
        private String appointmentId;
    }
} 