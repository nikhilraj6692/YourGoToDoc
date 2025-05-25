package com.mediconnect.controller;

import com.mediconnect.dto.schedule.ScheduleResponse;
import com.mediconnect.dto.schedule.ScheduleSlotRequest;
import com.mediconnect.dto.schedule.DeleteSlotsRequest;
import com.mediconnect.model.Calendar;
import com.mediconnect.service.ScheduleService;
import com.mediconnect.service.UserService;
import com.mediconnect.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedule")
@PreAuthorize("hasRole('DOCTOR')")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private UserService userService;

    @GetMapping("/daily")
    public ResponseEntity<ScheduleResponse> getDailySchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dates) {
        String email = UserContext.getCurrentUserEmail();
        String doctorId = userService.findByEmail(email).getId();
        List<Calendar> calendars = scheduleService.getDailySchedule(doctorId, dates);
        
        ScheduleResponse response = new ScheduleResponse();
        response.setSlots(Optional.ofNullable(calendars).orElse(List.of()).stream()
            .flatMap(calendar -> Optional.ofNullable(calendar.getSlots()).orElse(List.of()).stream()
                .map(slot -> {
                    ScheduleResponse.TimeSlot timeSlot = new ScheduleResponse.TimeSlot();
                    timeSlot.setId(slot.getId());
                    timeSlot.setCalendarId(calendar.getId());
                    timeSlot.setStartTime(slot.getStartTime());
                    timeSlot.setEndTime(slot.getEndTime());
                    timeSlot.setAvailable(slot.isAvailable());
                    timeSlot.setPatientName(slot.getAppointmentId() != null ? "Booked" : null);
                    return timeSlot;
                }))
            .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/slots")
    public ResponseEntity<ScheduleResponse> addSlots(
            @RequestBody ScheduleSlotRequest request) {
        String email = UserContext.getCurrentUserEmail();
        String doctorId = userService.findByEmail(email).getId();
        List<Calendar> calendars = scheduleService.addSlots(doctorId, request);
        
        ScheduleResponse response = new ScheduleResponse();
        response.setSlots(calendars.stream()
            .flatMap(calendar -> calendar.getSlots().stream()
                .map(slot -> {
                    ScheduleResponse.TimeSlot timeSlot = new ScheduleResponse.TimeSlot();
                    timeSlot.setStartTime(slot.getStartTime());
                    timeSlot.setEndTime(slot.getEndTime());
                    timeSlot.setAvailable(slot.isAvailable());
                    timeSlot.setPatientName(slot.getAppointmentId() != null ? "Booked" : null);
                    return timeSlot;
                }))
            .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/calendar/{calendarId}/slots/{slotId}")
    public ResponseEntity<Void> deleteSlot(
            @PathVariable String calendarId,
            @PathVariable String slotId) {
        String email = UserContext.getCurrentUserEmail();
        String doctorId = userService.findByEmail(email).getId();
        scheduleService.deleteSlot(doctorId, calendarId, slotId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/slots")
    public ResponseEntity<Void> deleteSlotsInRange(
            @RequestBody DeleteSlotsRequest request) {
        String email = UserContext.getCurrentUserEmail();
        String doctorId = userService.findByEmail(email).getId();
        scheduleService.deleteSlotsInRange(doctorId, request);
        return ResponseEntity.ok().build();
    }
} 