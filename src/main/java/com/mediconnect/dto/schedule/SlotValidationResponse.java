package com.mediconnect.dto.schedule;

import com.mediconnect.model.Calendar;
import java.util.List;
import java.util.ArrayList;

public class SlotValidationResponse {
    private boolean valid;
    private String message;
    private boolean canForceExtension;
    private List<Calendar.Slot> conflictingAvailableSlots;
    private List<Calendar.Slot> conflictingBookedSlots;

    // Constructors
    public SlotValidationResponse() {
        this.valid = true;
        this.message = "";
        this.canForceExtension = false;
        this.conflictingAvailableSlots = new ArrayList<>();
        this.conflictingBookedSlots = new ArrayList<>();
    }

    public SlotValidationResponse(boolean valid, String message) {
        this();
        this.valid = valid;
        this.message = message;
    }

    // Getters and Setters
    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isCanForceExtension() {
        return canForceExtension;
    }

    public void setCanForceExtension(boolean canForceExtension) {
        this.canForceExtension = canForceExtension;
    }

    public List<Calendar.Slot> getConflictingAvailableSlots() {
        return conflictingAvailableSlots;
    }

    public void setConflictingAvailableSlots(List<Calendar.Slot> conflictingAvailableSlots) {
        this.conflictingAvailableSlots = conflictingAvailableSlots;
    }

    public List<Calendar.Slot> getConflictingBookedSlots() {
        return conflictingBookedSlots;
    }

    public void setConflictingBookedSlots(List<Calendar.Slot> conflictingBookedSlots) {
        this.conflictingBookedSlots = conflictingBookedSlots;
    }

    // Helper methods
    public boolean hasConflictingAvailableSlots() {
        return conflictingAvailableSlots != null && !conflictingAvailableSlots.isEmpty();
    }

    public boolean hasConflictingBookedSlots() {
        return conflictingBookedSlots != null && !conflictingBookedSlots.isEmpty();
    }

    public boolean hasAnyConflicts() {
        return hasConflictingAvailableSlots() || hasConflictingBookedSlots();
    }
}