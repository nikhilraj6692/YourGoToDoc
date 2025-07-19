package com.mediconnect.dto.schedule;

import lombok.Data;

@Data
public class RescheduleRequest {
    private String oldSlotId;
    private String oldCalendarId;
    private String newSlotId;
    private String newCalendarId;
} 