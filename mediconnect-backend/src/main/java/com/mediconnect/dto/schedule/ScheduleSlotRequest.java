package com.mediconnect.dto.schedule;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class ScheduleSlotRequest {
    private LocalDate startDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean isRecurring;
    private LocalDate recurringEndDate;
    private List<Integer> recurringDays; // 0-6 for Sunday-Saturday
    
    // New fields for slot management
    private int slotDurationMinutes; // Duration of each slot in minutes
    private int gapDurationMinutes; // Gap between slots in minutes
    private boolean extendExistingSlot; // Flag to indicate if we're extending an existing slot
    private String existingSlotId; // ID of the slot being modified (if any)
    private boolean extendStartTime; // Flag to indicate if we're extending start time
    private boolean extendEndTime; // Flag to indicate if we're extending end time
    private int extensionMinutes; // Number of minutes to extend (if extending)
} 