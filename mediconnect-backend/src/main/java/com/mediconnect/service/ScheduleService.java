package com.mediconnect.service;


import com.mediconnect.dto.schedule.ScheduleSlotRequest;
import com.mediconnect.dto.schedule.SlotExtensionRequest;
import com.mediconnect.dto.schedule.SlotValidationResponse;
import com.mediconnect.dto.schedule.DeleteSlotsRequest;
import com.mediconnect.dto.schedule.RescheduleRequest;
import com.mediconnect.model.Calendar;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ScheduleService {
    
    /**
     * Get monthly schedule for a doctor
     */
    List<Calendar> getDailySchedule(String doctorId, List<LocalDate> dates);
    
    /**
     * Add new slots for a doctor
     */
    List<Calendar> addSlots(String doctorId, ScheduleSlotRequest request);
    
    /**
     * Calculate possible end times based on start time, slot duration and gap
     * This helps in creating dropdown for end times in the frontend
     */
    List<LocalTime> calculatePossibleEndTimes(LocalTime startTime, int slotDurationMinutes, int gapDurationMinutes);
    
    /**
     * Validate if the combination of start time, end time, slot duration and gap is valid
     */
    boolean validateTimeSlotCombination(LocalTime startTime, LocalTime endTime, 
                                       int slotDurationMinutes, int gapDurationMinutes);
    
    /**
     * Extend a slot's time - either start time, end time, or both
     * Returns validation response with warnings/errors
     */
    SlotValidationResponse extendSlot(String doctorId, SlotExtensionRequest request);
    
    /**
     * Reduce a slot's duration - this should always be allowed
     */
    Calendar reduceSlot(String doctorId, String calendarId, String slotId, 
                       int reduceStartMinutes, int reduceEndMinutes);
    
    /**
     * Delete a specific slot
     */
    void deleteSlot(String doctorId, String calendarId, String slotId);
    
    void deleteSlotsInRange(String doctorId, DeleteSlotsRequest request);

    /**
     * Reschedule an appointment from one slot to another
     */
    void rescheduleAppointment(String doctorId, RescheduleRequest request);
}