package com.mediconnect.controller;

import com.mediconnect.dto.appointment.AppointmentRequest;
import com.mediconnect.dto.appointment.AppointmentResponse;
import com.mediconnect.dto.common.ErrorVO;
import com.mediconnect.dto.common.StructuredErrorResponse;
import com.mediconnect.enums.ErrorCode;
import com.mediconnect.enums.AppointmentStatus;
import com.mediconnect.enums.AppointmentType;
import com.mediconnect.enums.UserRole;
import com.mediconnect.model.Appointment;
import com.mediconnect.model.Calendar;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import com.mediconnect.repository.AppointmentRepository;
import com.mediconnect.repository.DoctorProfileRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.repository.CalendarRepository;
import com.mediconnect.service.EmailService;
import com.mediconnect.service.UserService;
import com.mediconnect.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
@Tag(name = "Appointment Management", description = "APIs for managing appointments")
@Slf4j
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private CalendarRepository calendarRepository;
    @Autowired
    private DoctorProfileRepository doctorProfileRepository;
    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create a new appointment", description = "Creates a new appointment for a patient with a doctor")
    public ResponseEntity<?> createAppointment(
            @Valid @RequestBody AppointmentRequest request) {

        log.info("Creating appointment - Doctor: {}, Calendar: {}, Slot: {}", 
                request.getDoctorId(), request.getCalendarId(), request.getSlotId());

        String userEmail = UserContext.getCurrentUserEmail();
        User patient = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Calendar> calendarOpt = calendarRepository.findById(request.getCalendarId());

        if (calendarOpt.isEmpty()) {
            log.error("Calendar not found for ID: {}", request.getCalendarId());
            return ResponseEntity.status(400).build();
        }

        Calendar calendar = calendarOpt.get();

        // Verify the slot exists and is available
        Optional<Calendar.Slot> slotOpt = calendar.getSlots().stream()
                .filter(slot -> slot.getId().equals(request.getSlotId()) && slot.isAvailable())
                .findFirst();

        if (slotOpt.isEmpty()) {
            log.error("Slot not available - Calendar: {}, Slot: {}", request.getCalendarId(), request.getSlotId());
            return ResponseEntity.status(400).contentType(MediaType.APPLICATION_JSON)
                    .body(StructuredErrorResponse.fromErrorCode(ErrorCode.SLOT_NOT_AVAILABLE));
        }

        Calendar.Slot slot = slotOpt.get();

        // Check for scheduling conflicts
        List<Appointment> conflicts = appointmentRepository.findByPatientIdAndCalendarIdActive(
                patient.getId(), request.getCalendarId());

        if (!conflicts.isEmpty()) {
            log.warn("Scheduling conflict detected - Patient: {}, Calendar: {}, Conflicts: {}", 
                    patient.getId(), request.getCalendarId(), conflicts.size());
            return ResponseEntity.status(400).contentType(MediaType.APPLICATION_JSON)
                    .body(StructuredErrorResponse.fromErrorCode(ErrorCode.SCHEDULING_CONFLICT));
        }

        Appointment appointment = new Appointment();
        appointment.setDoctorId(request.getDoctorId());
        appointment.setPatientId(patient.getId());
        appointment.setCalendarId(request.getCalendarId());
        appointment.setSlotId(request.getSlotId());
        appointment.setType(AppointmentType.valueOf(request.getType()));
        appointment.setReason(request.getReason());

        appointment = appointmentRepository.save(appointment);

        // Update slot availability
        slot.setAvailable(false);
        slot.setAppointmentId(appointment.getId());
        calendarRepository.save(calendar);

        // Send email notifications
        try {
            var doctor = userRepository.findById(request.getDoctorId()).orElseThrow();

            // Notify doctor
            emailService.sendAppointmentStatusEmail(
                doctor.getEmail(),
                doctor.getFullName(),
                "SCHEDULED",
                slot.getStartTime(),
                slot.getStartTime(),
                slot.getEndTime(),
                appointment.getType(),
                null
            );

            // Notify patient
            emailService.sendAppointmentStatusEmail(
                patient.getEmail(),
                patient.getFullName(),
                "SCHEDULED",
                slot.getStartTime(),
                slot.getStartTime(),
                slot.getEndTime(),
                appointment.getType(),
                null
            );
        } catch (MessagingException e) {
            // Log the error but don't fail the request
            log.error("Failed to send email notifications for appointment: {}", appointment.getId(), e);
        }

        return ResponseEntity.ok(AppointmentResponse.fromAppointment(appointment));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get doctor's appointments", description = "Retrieves all appointments for a doctor with optional date and status filtering")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        String email = UserContext.getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        String doctorId = doctorProfile.getId();
        List<Appointment> appointments;

        if (date != null) {
            // Filter by specific date - only show scheduled and confirmed appointments
            List<String> calendarIds = calendarRepository.findByDoctorIdAndDate(user.getId(), date)
                    .stream()
                    .map(Calendar::getId)
                    .collect(Collectors.toList());
            
            // When date is passed, only show scheduled and confirmed appointments
            List<String> statuses = List.of("SCHEDULED", "CONFIRMED");
            appointments = appointmentRepository.findByDoctorIdAndStatusInAndCalendarIds(user.getId(), statuses, calendarIds);
        } else {
            // Get all appointments for the doctor based on status filter
            if (status != null) {
                appointments = appointmentRepository.findByDoctorIdAndStatus(user.getId(), status);
            } else {
                appointments = appointmentRepository.findByDoctorId(user.getId());
            }
        }

        // Sort appointments based on requirements
        appointments.sort((a, b) -> {
            LocalDateTime endTimeA = getAppointmentEndTime(a);
            LocalDateTime endTimeB = getAppointmentEndTime(b);
            
            // Always sort by end time descending
            return endTimeB.compareTo(endTimeA);
        });

        List<AppointmentResponse> response = appointments.stream()
            .map(this::createAppointmentResponseWithDetails)
            .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get patient's appointments", description = "Retrieves all appointments for a patient")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(
            @RequestAttribute("userId") String patientId,
            @RequestParam(required = false) String status) {
        
        List<Appointment> appointments = status != null ?
            appointmentRepository.findByPatientIdAndStatus(patientId, status) :
            appointmentRepository.findByPatientId(patientId);

        List<AppointmentResponse> response = appointments.stream()
            .map(AppointmentResponse::fromAppointment)
            .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Confirm an appointment", description = "Confirms a scheduled appointment")
    public ResponseEntity<AppointmentResponse> confirmAppointment(
            @PathVariable String id) {

        String email = UserContext.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctorId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setUpdatedAt(System.currentTimeMillis());
        appointment = appointmentRepository.save(appointment);

        // Send email notifications
        try {
            var doctor = userRepository.findById(user.getId()).orElseThrow();
            var patient = userRepository.findById(appointment.getPatientId()).orElseThrow();


            // Notify patient
            emailService.sendAppointmentStatusEmail(
                patient.getEmail(),
                patient.getFullName(),
                "CONFIRMED",
                null, //appointment.getStartTime(),
                    null, //appointment.getStartTime(),
                    null, //appointment.getEndTime(),
                appointment.getType(),
                null
            );
        } catch (MessagingException e) {
            // Log the error but don't fail the request
            e.printStackTrace();
        }

        return ResponseEntity.ok(AppointmentResponse.fromAppointment(appointment));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Cancel an appointment", description = "Cancels an appointment with a reason")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable String id,
            @RequestAttribute("userId") String userId,
            @RequestParam String reason) {
        
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctorId().equals(userId) && !appointment.getPatientId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setUpdatedAt(System.currentTimeMillis());
        appointment = appointmentRepository.save(appointment);

        // Send email notifications
        try {
            var doctor = userRepository.findById(appointment.getDoctorId()).orElseThrow();
            var patient = userRepository.findById(appointment.getPatientId()).orElseThrow();

            // Notify both parties
            emailService.sendAppointmentStatusEmail(
                doctor.getEmail(),
                doctor.getFullName(),
                "CANCELLED",
                    null, //appointment.getStartTime(),
                    null, //appointment.getStartTime(),
                    null, //appointment.getEndTime(),
                appointment.getType(),
                reason
            );

            emailService.sendAppointmentStatusEmail(
                patient.getEmail(),
                patient.getFullName(),
                "CANCELLED",
                    null, //appointment.getStartTime(),
                    null, //appointment.getStartTime(),
                    null, //appointment.getEndTime(),
                appointment.getType(),
                reason
            );
        } catch (MessagingException e) {
            // Log the error but don't fail the request
            e.printStackTrace();
        }

        return ResponseEntity.ok(AppointmentResponse.fromAppointment(appointment));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Complete an appointment", description = "Marks an appointment as completed")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable String id,
            @RequestAttribute("userId") String doctorId) {
        
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctorId().equals(doctorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setUpdatedAt(System.currentTimeMillis());
        appointment = appointmentRepository.save(appointment);

        // Send email notifications
        try {
            var doctor = userRepository.findById(doctorId).orElseThrow();
            var patient = userRepository.findById(appointment.getPatientId()).orElseThrow();

            // Notify patient
            emailService.sendAppointmentStatusEmail(
                patient.getEmail(),
                patient.getFullName(),
                "COMPLETED",
                    null, //appointment.getStartTime(),
                    null, //appointment.getStartTime(),
                    null, //appointment.getEndTime(),
                appointment.getType(),
                null
            );
        } catch (MessagingException e) {
            // Log the error but don't fail the request
            e.printStackTrace();
        }

        return ResponseEntity.ok(AppointmentResponse.fromAppointment(appointment));
    }

    // 1. Get available slots for a doctor for the month
    @GetMapping("/doctor/{doctorId}/month-slots")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Map<LocalDate, Map<String, Object>>> getDoctorMonthSlots(
            @PathVariable String doctorId) {

        String userEmail = UserContext.getCurrentUserEmail();
        User patient = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate todayDate = LocalDate.now();
        LocalDate endDate = todayDate
                .withDayOfMonth(todayDate.lengthOfMonth());

        List<Calendar> calendars = calendarRepository.findByDoctorIdAndDateBetween(doctorId, todayDate, endDate);
        Map<LocalDate, Map<String, Object>> result = new HashMap<>();

        LocalDateTime now = LocalDateTime.now();

        for (Calendar calendar : calendars) {
            Map<String, Object> dayInfo = new HashMap<>();
            
            // Check if patient has any appointments for this day
            Optional<Appointment> patientAppointment = appointmentRepository.findByPatientIdAndCalendarIdAndStatusIsNot(
                    patient.getId(), calendar.getId(), "CANCELLED")
                    .stream()
                    .findFirst();

            if (patientAppointment.isPresent()) {
                Appointment appointment = patientAppointment.get();
                Optional<Calendar.Slot> slot = calendar.getSlots().stream()
                        .filter(s -> s.getId().equals(appointment.getSlotId()))
                        .findFirst();

                if (slot.isPresent()) {
                    dayInfo.put("hasAppointment", true);
                    dayInfo.put("status", appointment.getStatus().toString());
                    dayInfo.put("startTime", slot.get().getStartTime());
                    dayInfo.put("endTime", slot.get().getEndTime());
                    dayInfo.put("appointmentId", appointment.getId());
                }
            } else {
                // Check for available slots
                boolean hasAvailableSlot = calendar.getSlots().stream()
                        .anyMatch(slot -> slot.isAvailable() && slot.getStartTime().isAfter(now));
                dayInfo.put("hasAppointment", false);
                dayInfo.put("hasAvailableSlot", hasAvailableSlot);
            }

            result.put(calendar.getDate(), dayInfo);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/doctor/{doctorId}/day-slots")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get available slots for a specific day", description = "Retrieves all available slots for a doctor on a specific day after the current time")
    public ResponseEntity<List<Map<String, Object>>> getDoctorDaySlots(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        String userEmail = UserContext.getCurrentUserEmail();
        User user = userService.findByEmail(userEmail);

        if(null == user) {
            throw new RuntimeException("User not found");
        }
        
        // Get the calendar for the specified date
        Optional<Calendar> calendarOpt = calendarRepository.findByDoctorIdAndDate(doctorId, date);
        
        if (calendarOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Calendar calendar = calendarOpt.get();
        LocalDateTime now = LocalDateTime.now();

        Map<String, String> appointmentIdToSlotId = new HashMap<>();

        // Filter slots that are available and after the current time
        Map<String, Calendar.Slot> availableSlots = calendar.getSlots().stream()
                .filter(slot -> slot.isAvailable() && slot.getStartTime().isAfter(now))
                .collect(Collectors.toMap(Calendar.Slot::getId, Function.identity()));

        List<Appointment> appointments = appointmentRepository.findAllBySlotIdIn(
                availableSlots.values().stream().map(Calendar.Slot::getId).collect(Collectors.toList()));

        Map<String, Appointment> slotIdToAppointment = Optional.ofNullable(appointments)
                .orElse(Collections.emptyList()).stream().collect(Collectors.toMap(Appointment::getSlotId, Function.identity()));

        List<Map<String, Object>> result = new ArrayList<>();

        availableSlots.forEach((slotId, slot) -> {
            Map<String, Object> dayInfo = new HashMap<>();

            if (null != slotIdToAppointment.get(slotId)) {
                dayInfo.put("appointmentId", slotIdToAppointment.get(slotId).getId());
                dayInfo.put("status", slotIdToAppointment.get(slotId).getStatus().toString());
            }

            dayInfo.put("id", slot.getId());
            dayInfo.put("startTime", slot.getStartTime());
            dayInfo.put("endTime", slot.getEndTime());
            dayInfo.put("calendarId", calendar.getId());
            result.add(dayInfo);

        });

        return ResponseEntity.ok(result);
    }

    // Helper method to get appointment date/time from calendar and slot
    private LocalDateTime getAppointmentDateTime(Appointment appointment) {
        Calendar calendar = calendarRepository.findById(appointment.getCalendarId()).orElse(null);
        if (calendar != null) {
            return calendar.getSlots().stream()
                    .filter(slot -> slot.getId().equals(appointment.getSlotId()))
                    .findFirst()
                    .map(Calendar.Slot::getStartTime)
                    .orElse(LocalDateTime.now());
        }
        return LocalDateTime.now();
    }

    // Helper method to get appointment end time from calendar and slot
    private LocalDateTime getAppointmentEndTime(Appointment appointment) {
        Calendar calendar = calendarRepository.findById(appointment.getCalendarId()).orElse(null);
        if (calendar != null) {
            return calendar.getSlots().stream()
                    .filter(slot -> slot.getId().equals(appointment.getSlotId()))
                    .findFirst()
                    .map(Calendar.Slot::getEndTime)
                    .orElse(LocalDateTime.now());
        }
        return LocalDateTime.now();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Get appointment by ID", description = "Retrieves a specific appointment by its ID")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable String id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        String userEmail = UserContext.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user has access to this appointment
        if ((currentUser.getRole() == UserRole.DOCTOR && !appointment.getDoctorId().equals(currentUser.getId())) ||
                (currentUser.getRole() == UserRole.PATIENT && !appointment.getPatientId().equals(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        AppointmentResponse response = createAppointmentResponseWithDetails(appointment);
        return ResponseEntity.ok(response);
    }

    // Helper method to create appointment response with patient details
    private AppointmentResponse createAppointmentResponseWithDetails(Appointment appointment) {
        AppointmentResponse response = AppointmentResponse.fromAppointment(appointment);
        
        // Get patient details (only name for privacy)
        User patient = userRepository.findById(appointment.getPatientId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (patient != null) {
            response.setPatientName(patient.getFullName());
        }
        
        // Get doctor details
        User doctor = userRepository.findById(appointment.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor != null) {
            response.setDoctorName(doctor.getFullName());
        }
        
        // Get appointment date/time from actual slot
        LocalDateTime appointmentDateTime = getAppointmentDateTime(appointment);
        LocalDateTime appointmentEndTime = getAppointmentEndTime(appointment);
        response.setStartTime(appointmentDateTime);
        response.setEndTime(appointmentEndTime);
        
        return response;
    }


} 