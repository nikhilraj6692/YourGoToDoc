package com.mediconnect.service.impl;

import com.mediconnect.exception.SlotException;
import com.mediconnect.dto.schedule.DeleteSlotsRequest;
import com.mediconnect.dto.schedule.ScheduleSlotRequest;
import com.mediconnect.dto.schedule.SlotExtensionRequest;
import com.mediconnect.dto.schedule.SlotValidationResponse;
import com.mediconnect.dto.schedule.RescheduleRequest;
import com.mediconnect.model.Calendar;
import com.mediconnect.model.Appointment;
import com.mediconnect.enums.AppointmentStatus;
import com.mediconnect.repository.CalendarRepository;
import com.mediconnect.repository.AppointmentRepository;
import com.mediconnect.service.ScheduleService;
import com.mediconnect.util.SlotMergeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduleServiceImpl implements ScheduleService {

    @Autowired
    private CalendarRepository calendarRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    private static final int MIN_SLOT_DURATION = 15; // Minimum slot duration in minutes

    @Override
    public List<Calendar> getDailySchedule(String doctorId, List<LocalDate> dates) {
        // Only allow viewing current month's schedule
        LocalDate today = LocalDate.now();
        for(LocalDate date : dates) {
            if (date.getMonth() != today.getMonth() || date.getYear() != today.getYear()) {
                throw new IllegalArgumentException("Can only view current month's schedule");
            }
        }


        return calendarRepository.findByDoctorIdAndDateIn(doctorId, dates);
    }

    @Transactional
    @Override
    public List<Calendar> addSlots(String doctorId, ScheduleSlotRequest request) {
        validateSlotRequest(request);

        List<Calendar> newCalendars = createSlots(doctorId, request);

        // Save and merge with existing calendars
        return saveAndMergeSlots(doctorId, newCalendars, request.getGapDurationMinutes());
    }

    /**
     * Calculate possible end times based on start time, slot duration and gap
     */
    public List<LocalTime> calculatePossibleEndTimes(LocalTime startTime, int slotDurationMinutes, int gapDurationMinutes) {
        List<LocalTime> possibleEndTimes = new ArrayList<>();

        // Start with minimum possible end time (start + one slot)
        LocalTime currentEndTime = startTime.plusMinutes(slotDurationMinutes);

        // Generate possible end times up to end of day
        while (currentEndTime.isBefore(LocalTime.of(23, 59))) {
            possibleEndTimes.add(currentEndTime);
            // Next possible end time = current + slot duration + gap
            currentEndTime = currentEndTime.plusMinutes(slotDurationMinutes + gapDurationMinutes);
        }

        return possibleEndTimes;
    }

    /**
     * Validate if the combination of start time, end time, slot duration and gap is valid
     */
    public boolean validateTimeSlotCombination(LocalTime startTime, LocalTime endTime,
                                               int slotDurationMinutes, int gapDurationMinutes) {

        // Calculate how many complete slots can fit
        int totalMinutes = (endTime.toSecondOfDay() - startTime.toSecondOfDay()) / 60;

        // Check if we can fit at least one complete slot
        if (totalMinutes < slotDurationMinutes) {
            throw SlotException.slotLargeConflict();
        }

        // Calculate exact slots that would be created
        List<Calendar.Slot> testSlots = generateSlotsForTimeRange(startTime, endTime,
                slotDurationMinutes, gapDurationMinutes, LocalDate.now());

        // The last slot should end exactly at or before the specified end time
        // this is not required but it is for safety
        if (!testSlots.isEmpty()) {
            System.out.println("The last slot should end exactly at or before the specified end time");
            Calendar.Slot lastSlot = testSlots.get(testSlots.size() - 1);
            return !lastSlot.getEndTime().toLocalTime().isAfter(endTime);
        }

        return false;
    }

    /**
     * Extend a slot's time - either start time, end time, or both
     */
    public SlotValidationResponse extendSlot(String doctorId, SlotExtensionRequest request) {
        Calendar calendar = calendarRepository.findById(request.getCalendarId())
                .orElseThrow(() -> new IllegalArgumentException("Calendar not found"));

        if (!calendar.getDoctorId().equals(doctorId)) {
            throw new IllegalArgumentException("Unauthorized to modify this slot");
        }

        Calendar.Slot targetSlot = calendar.getSlots().stream()
                .filter(slot -> slot.getId().equals(request.getSlotId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        LocalDateTime newStartTime = targetSlot.getStartTime();
        LocalDateTime newEndTime = targetSlot.getEndTime();

        // Apply extensions
        if (request.isExtendStartTime()) {
            newStartTime = targetSlot.getStartTime().minusMinutes(request.getStartExtensionMinutes());
        }

        if (request.isExtendEndTime()) {
            newEndTime = targetSlot.getEndTime().plusMinutes(request.getEndExtensionMinutes());
        }

        // Check for overlaps with existing slots
        SlotValidationResponse validation = validateSlotExtension(doctorId, calendar.getDate(),
                newStartTime, newEndTime, request.getSlotId());

        if (validation.isValid() || request.isForceExtension()) {
            // If forcing extension, remove conflicting available slots
            if (request.isForceExtension() && !validation.getConflictingAvailableSlots().isEmpty()) {
                removeConflictingSlots(calendar, validation.getConflictingAvailableSlots());
            }

            // Update the slot
            targetSlot.setStartTime(newStartTime);
            targetSlot.setEndTime(newEndTime);

            calendarRepository.save(calendar);
            validation.setValid(true);
            validation.setMessage("Slot extended successfully");
        }

        return validation;
    }

    /**
     * Reduce a slot's duration - this should always be allowed
     */
    public Calendar reduceSlot(String doctorId, String calendarId, String slotId,
                               int reduceStartMinutes, int reduceEndMinutes) {
        Calendar calendar = calendarRepository.findById(calendarId)
                .orElseThrow(() -> new IllegalArgumentException("Calendar not found"));

        if (!calendar.getDoctorId().equals(doctorId)) {
            throw new IllegalArgumentException("Unauthorized to modify this slot");
        }

        Calendar.Slot targetSlot = calendar.getSlots().stream()
                .filter(slot -> slot.getId().equals(slotId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        // Calculate new times
        LocalDateTime newStartTime = targetSlot.getStartTime().plusMinutes(reduceStartMinutes);
        LocalDateTime newEndTime = targetSlot.getEndTime().minusMinutes(reduceEndMinutes);

        // Validate that the slot still has minimum duration
        long durationMinutes = java.time.Duration.between(newStartTime, newEndTime).toMinutes();
        if (durationMinutes < MIN_SLOT_DURATION) {
            throw new IllegalArgumentException("Slot cannot be reduced below " + MIN_SLOT_DURATION + " minutes");
        }

        // Update the slot
        targetSlot.setStartTime(newStartTime);
        targetSlot.setEndTime(newEndTime);

        return calendarRepository.save(calendar);
    }

    private void validateSlotRequest(ScheduleSlotRequest request) {
        // Validate slot duration
        if (request.getSlotDurationMinutes() < MIN_SLOT_DURATION) {
            throw new IllegalArgumentException("Slot duration cannot be less than " + MIN_SLOT_DURATION + " minutes");
        }

        // Validate gap duration
        if (request.getGapDurationMinutes() < 0) {
            throw new IllegalArgumentException("Gap duration cannot be negative");
        }

        // Validate time slot combination
        if (!validateTimeSlotCombination(request.getStartTime(), request.getEndTime(),
                request.getSlotDurationMinutes(), request.getGapDurationMinutes())) {
            throw new IllegalArgumentException("Invalid time slot combination. Please check start time, end time, slot duration and gap settings.");
        }

        // Validate date restrictions
        LocalDate startDate = request.getStartDate();
        LocalDate today = LocalDate.now();
        LocalDate lastDayOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        if (startDate.isBefore(today)) {
            throw new IllegalArgumentException("Cannot add slots for past dates");
        }

        if (startDate.isAfter(lastDayOfMonth)) {
            throw new IllegalArgumentException("Cannot add slots for next month");
        }

        if (null!=request.getIsRecurring() && request.getIsRecurring() && request.getRecurringEndDate() != null) {
            if (request.getRecurringEndDate().isAfter(lastDayOfMonth)) {
                throw new IllegalArgumentException("Recurring slots cannot extend to next month");
            }
        }
    }

    private List<Calendar> createSlots(String doctorId, ScheduleSlotRequest request) {
        List<Calendar> calendars = new ArrayList<>();
        LocalDate currentDate = request.getStartDate();
        LocalDate endDate = null!=request.getIsRecurring() && request.getIsRecurring() ? request.getRecurringEndDate() : request.getStartDate();


        while (!currentDate.isAfter(endDate)) {
            // Skip dates that are not in the recurring days
            if (null!=request.getIsRecurring() && request.getIsRecurring() && request.getRecurringDays() != null &&
                    !request.getRecurringDays().contains(currentDate.getDayOfWeek().getValue() % 7)) {
                currentDate = currentDate.plusDays(1);
                continue;
            }

            // Generate slots for this date
            List<Calendar.Slot> slots = generateSlotsForTimeRange(
                    request.getStartTime(),
                    request.getEndTime(),
                    request.getSlotDurationMinutes(),
                    request.getGapDurationMinutes(),
                    currentDate
            );

            if (!slots.isEmpty()) {
                Calendar calendar = new Calendar();
                calendar.setDoctorId(doctorId);
                calendar.setDate(currentDate);
                calendar.setSlots(slots);
                calendars.add(calendar);
            }

            currentDate = currentDate.plusDays(1);
        }

        return calendars;
    }

    private List<Calendar.Slot> generateSlotsForTimeRange(LocalTime startTime, LocalTime endTime,
                                                          int slotDurationMinutes, int gapDurationMinutes,
                                                          LocalDate date) {
        List<Calendar.Slot> slots = new ArrayList<>();
        LocalDateTime currentSlotStart = date.atTime(startTime);

        LocalDateTime endDateTime = date.atTime(endTime);

        while (true) {
            LocalDateTime currentSlotEndTime = (currentSlotStart).plusMinutes(slotDurationMinutes);

            // Check if this slot would end after our target end time
            if (currentSlotEndTime.isAfter(endDateTime)) {
                break;
            }

            // Create the slot
            Calendar.Slot slot = new Calendar.Slot();
            slot.setId(UUID.randomUUID().toString());
            slot.setStartTime(currentSlotStart);
            slot.setEndTime(currentSlotEndTime);
            slot.setAvailable(true);
            slots.add(slot);

            // Calculate next slot start time (current end + gap)
            currentSlotStart = currentSlotEndTime.plusMinutes(gapDurationMinutes);
        }

        return slots;
    }

    private SlotValidationResponse validateSlotExtension(String doctorId, LocalDate date,
                                                         LocalDateTime newStartTime, LocalDateTime newEndTime,
                                                         String currentSlotId) {
        SlotValidationResponse response = new SlotValidationResponse();
        response.setValid(true);

        Calendar existingCalendar = calendarRepository.findByDoctorIdAndDate(
                doctorId, date).orElse(null);

        List<Calendar.Slot> conflictingAvailableSlots = new ArrayList<>();
        List<Calendar.Slot> conflictingBookedSlots = new ArrayList<>();


        assert existingCalendar != null;
        for (Calendar.Slot slot : existingCalendar.getSlots()) {
            // Skip the current slot being extended
            if (slot.getId().equals(currentSlotId)) {
                continue;
            }

            if (isOverlapping(newStartTime, newEndTime, slot.getStartTime(), slot.getEndTime())) {
                if (slot.isAvailable()) {
                    conflictingAvailableSlots.add(slot);
                } else {
                    conflictingBookedSlots.add(slot);
                }
            }
        }


        response.setConflictingAvailableSlots(conflictingAvailableSlots);
        response.setConflictingBookedSlots(conflictingBookedSlots);

        if (!conflictingBookedSlots.isEmpty()) {
            response.setValid(false);
            response.setMessage("Cannot extend slot. It overlaps with booked appointments: " +
                    conflictingBookedSlots.stream()
                            .map(slot -> slot.getStartTime().toLocalTime() + " - " + slot.getEndTime().toLocalTime())
                            .collect(Collectors.joining(", ")));
        } else if (!conflictingAvailableSlots.isEmpty()) {
            response.setValid(false);
            response.setMessage("Extension will overlap with existing available slots: " +
                    conflictingAvailableSlots.stream()
                            .map(slot -> slot.getStartTime().toLocalTime() + " - " + slot.getEndTime().toLocalTime())
                            .collect(Collectors.joining(", ")) +
                    ". These slots will be removed if you proceed.");
            response.setCanForceExtension(true);
        }

        return response;
    }

    private void removeConflictingSlots(Calendar calendar, List<Calendar.Slot> conflictingSlots) {
        List<String> conflictingSlotIds = conflictingSlots.stream()
                .map(Calendar.Slot::getId)
                .collect(Collectors.toList());

        calendar.getSlots().removeIf(slot -> conflictingSlotIds.contains(slot.getId()));
    }

    private boolean isOverlapping(LocalDateTime newSlotStart, LocalDateTime newSlotEnd,
                                  LocalDateTime existingSlotStart, LocalDateTime existingSlotEnd) {
        return newSlotStart.isBefore(existingSlotEnd) && newSlotEnd.isAfter(existingSlotStart);
    }

    private List<Calendar> saveAndMergeSlots(String doctorId, List<Calendar> newCalendars, int gapDurationMinutes) {
        List<Calendar> savedCalendars = new ArrayList<>();

        for (Calendar newCalendar : newCalendars) {
            LocalDate date = newCalendar.getDate();

            Optional<Calendar> existingCalendarOpt = calendarRepository.findByDoctorIdAndDate(
                        doctorId, date);
            Calendar updatedCalendar;
            if (existingCalendarOpt.isEmpty()) {
                updatedCalendar = calendarRepository.save(newCalendar);
            } else {
                Calendar calendar = existingCalendarOpt.get();

                if(null == calendar.getSlots() || calendar.getSlots().isEmpty()) {
                    calendar.setSlots(newCalendar.getSlots());
                    calendarRepository.save(calendar);
                }

                List<Calendar.Slot> mergedSlots = SlotMergeUtil.merge(calendar.getSlots(), newCalendar.getSlots(),  gapDurationMinutes);
                calendar.setSlots(mergedSlots);
                updatedCalendar = calendarRepository.save(calendar);
            }

            savedCalendars.add(updatedCalendar);
        }

        return savedCalendars;
    }

    @Override
    @Transactional
    public void deleteSlot(String doctorId, String calendarId, String slotId) {
        Calendar calendar = calendarRepository.findByIdAndDoctorId(calendarId, doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Calendar not found"));

        // Find the slot
        Calendar.Slot slot = calendar.getSlots().stream()
                .filter(s -> s.getId().equals(slotId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        // If the slot is booked (not available), cancel the associated appointment
        if (!slot.isAvailable()) {
            String appointmentId = slot.getAppointmentId();
            if (appointmentId != null) {
                // Find and cancel the appointment
                Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
                if (appointmentOpt.isPresent()) {
                    Appointment appointment = appointmentOpt.get();
                    appointment.setStatus(AppointmentStatus.CANCELLED);
                    appointment.setUpdatedAt(System.currentTimeMillis());
                    appointmentRepository.save(appointment);
                }
            }

            slot.setAppointmentId(null);
            calendarRepository.save(calendar);
        } else {
            // If the slot is already available, remove it
            calendar.getSlots().removeIf(s -> s.getId().equals(slotId));

            // If no slots left, delete the calendar
            if (calendar.getSlots().isEmpty()) {
                calendarRepository.delete(calendar);
            } else {
                calendarRepository.save(calendar);
            }
        }
    }

    @Override
    public void deleteSlotsInRange(String doctorId, DeleteSlotsRequest request) {
        // Validate date restrictions
        LocalDate today = LocalDate.now();
        LocalDate lastDayOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        // Check if start date is before today
        if (request.getStartDate().isBefore(today)) {
            throw new IllegalArgumentException("Cannot delete slots for past dates");
        }

        // Check if dates are within current month
        if (request.getStartDate().getMonth() != today.getMonth() || 
            request.getStartDate().getYear() != today.getYear() ||
            request.getEndDate().getMonth() != today.getMonth() || 
            request.getEndDate().getYear() != today.getYear()) {
            throw new IllegalArgumentException("Can only delete slots for the current month");
        }

        // Check if end date is after last day of month
        if (request.getEndDate().isAfter(lastDayOfMonth)) {
            throw new IllegalArgumentException("Cannot delete slots beyond the current month");
        }

        // Get all calendars for the date range
        List<Calendar> calendars = calendarRepository.findByDoctorIdAndDateBetween(
            doctorId,
            request.getStartDate(),
            request.getEndDate()
        );

        // For each calendar, delete slots that fall within the time range
        for (Calendar calendar : calendars) {
            calendar.getSlots().removeIf(slot -> {
                LocalTime slotStartTime = slot.getStartTime().toLocalTime();
                LocalTime slotEndTime = slot.getEndTime().toLocalTime();
                
                // Check if slot overlaps with the requested time range
                boolean overlaps = !(slotEndTime.isBefore(request.getStartTime()) || 
                                  slotStartTime.isAfter(request.getEndTime()));
                
                // Only delete if slot is available (not booked)
                return overlaps && slot.isAvailable();
            });
        }

        // Save the updated calendars
        calendarRepository.saveAll(calendars);
    }

    @Override
    @Transactional
    public void rescheduleAppointment(String doctorId, RescheduleRequest request) {
        // Get the old calendar and slot
        Calendar oldCalendar = calendarRepository.findByIdAndDoctorId(request.getOldCalendarId(), doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Old calendar not found"));

        Calendar.Slot oldSlot = oldCalendar.getSlots().stream()
                .filter(slot -> slot.getId().equals(request.getOldSlotId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Old slot not found"));

        // Verify the old slot is booked
        if (oldSlot.isAvailable()) {
            throw new IllegalArgumentException("Cannot reschedule an available slot");
        }

        // If both calendars are the same, use the same calendar instance
        Calendar newCalendar;
        if (oldCalendar.getId().equals(request.getNewCalendarId())) {
            newCalendar = oldCalendar;
        } else {
            newCalendar = calendarRepository.findByIdAndDoctorId(request.getNewCalendarId(), doctorId)
                    .orElseThrow(() -> new IllegalArgumentException("New calendar not found"));
        }

        Calendar.Slot newSlot = newCalendar.getSlots().stream()
                .filter(slot -> slot.getId().equals(request.getNewSlotId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("New slot not found"));

        // Verify the new slot is available
        if (!newSlot.isAvailable()) {
            throw new IllegalArgumentException("New slot is already booked");
        }

        // Move the appointment from old slot to new slot
        String appointmentId = oldSlot.getAppointmentId();
        oldSlot.setAppointmentId(null);
        oldSlot.setAvailable(true);

        newSlot.setAppointmentId(appointmentId);
        newSlot.setAvailable(false);

        // If both calendars are the same, we only need to save once
        if (oldCalendar.getId().equals(newCalendar.getId())) {
            calendarRepository.save(oldCalendar);
        } else {
            // Save both calendars
            calendarRepository.save(oldCalendar);
            calendarRepository.save(newCalendar);
        }
    }
}