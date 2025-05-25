package com.mediconnect.dto.schedule;

public class SlotExtensionRequest {
    private String calendarId;
    private String slotId;
    private boolean extendStartTime;
    private boolean extendEndTime;
    private int startExtensionMinutes;
    private int endExtensionMinutes;
    private boolean forceExtension; // If true, remove conflicting available slots

    // Constructors
    public SlotExtensionRequest() {}

    public SlotExtensionRequest(String calendarId, String slotId, boolean extendStartTime, 
                               boolean extendEndTime, int startExtensionMinutes, int endExtensionMinutes) {
        this.calendarId = calendarId;
        this.slotId = slotId;
        this.extendStartTime = extendStartTime;
        this.extendEndTime = extendEndTime;
        this.startExtensionMinutes = startExtensionMinutes;
        this.endExtensionMinutes = endExtensionMinutes;
        this.forceExtension = false;
    }

    // Getters and Setters
    public String getCalendarId() {
        return calendarId;
    }

    public void setCalendarId(String calendarId) {
        this.calendarId = calendarId;
    }

    public String getSlotId() {
        return slotId;
    }

    public void setSlotId(String slotId) {
        this.slotId = slotId;
    }

    public boolean isExtendStartTime() {
        return extendStartTime;
    }

    public void setExtendStartTime(boolean extendStartTime) {
        this.extendStartTime = extendStartTime;
    }

    public boolean isExtendEndTime() {
        return extendEndTime;
    }

    public void setExtendEndTime(boolean extendEndTime) {
        this.extendEndTime = extendEndTime;
    }

    public int getStartExtensionMinutes() {
        return startExtensionMinutes;
    }

    public void setStartExtensionMinutes(int startExtensionMinutes) {
        this.startExtensionMinutes = startExtensionMinutes;
    }

    public int getEndExtensionMinutes() {
        return endExtensionMinutes;
    }

    public void setEndExtensionMinutes(int endExtensionMinutes) {
        this.endExtensionMinutes = endExtensionMinutes;
    }

    public boolean isForceExtension() {
        return forceExtension;
    }

    public void setForceExtension(boolean forceExtension) {
        this.forceExtension = forceExtension;
    }
}