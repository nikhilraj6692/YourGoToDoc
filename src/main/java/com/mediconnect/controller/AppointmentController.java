package com.mediconnect.controller;

import com.mediconnect.dto.appointment.AppointmentRequest;
import com.mediconnect.dto.appointment.AppointmentResponse;
import com.mediconnect.model.Appointment;
import com.mediconnect.repository.AppointmentRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
@Tag(name = "Appointment Management", description = "APIs for managing appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create a new appointment", description = "Creates a new appointment for a patient with a doctor")
    public ResponseEntity<AppointmentResponse> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @RequestAttribute("userId") String patientId) {
        
        // Check for scheduling conflicts
        List<Appointment> conflicts = appointmentRepository.findByDoctorIdAndStartTimeBetween(
            request.getDoctorId(), request.getStartTime(), request.getEndTime());
        
        if (!conflicts.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Appointment appointment = new Appointment();
        appointment.setDoctorId(request.getDoctorId());
        appointment.setPatientId(patientId);
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setType(request.getType());
        appointment.setReason(request.getReason());
        appointment.setNotes(request.getNotes());
        appointment.setLocation(request.getLocation());

        appointment = appointmentRepository.save(appointment);

        // Send email notifications
        try {
            var doctor = userRepository.findById(request.getDoctorId()).orElseThrow();
            var patient = userRepository.findById(patientId).orElseThrow();

            // Notify doctor
            emailService.sendAppointmentStatusEmail(
                doctor.getEmail(),
                doctor.getFullName(),
                "SCHEDULED",
                appointment.getStartTime(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getType(),
                appointment.getLocation(),
                appointment.getMeetingLink(),
                null
            );

            // Notify patient
            emailService.sendAppointmentStatusEmail(
                patient.getEmail(),
                patient.getFullName(),
                "SCHEDULED",
                appointment.getStartTime(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getType(),
                appointment.getLocation(),
                appointment.getMeetingLink(),
                null
            );
        } catch (MessagingException e) {
            // Log the error but don't fail the request
            e.printStackTrace();
        }

        return ResponseEntity.ok(AppointmentResponse.fromAppointment(appointment));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get doctor's appointments", description = "Retrieves all appointments for a doctor")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(
            @RequestAttribute("userId") String doctorId,
            @RequestParam(required = false) String status) {
        
        List<Appointment> appointments = status != null ?
            appointmentRepository.findByDoctorIdAndStatus(doctorId, status) :
            appointmentRepository.findByDoctorId(doctorId);

        List<AppointmentResponse> response = appointments.stream()
            .map(AppointmentResponse::fromAppointment)
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
            @PathVariable String id,
            @RequestAttribute("userId") String doctorId) {
        
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getDoctorId().equals(doctorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appointment.setStatus("CONFIRMED");
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
                "CONFIRMED",
                appointment.getStartTime(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getType(),
                appointment.getLocation(),
                appointment.getMeetingLink(),
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

        appointment.setStatus("CANCELLED");
        appointment.setCancelledAt(System.currentTimeMillis());
        appointment.setCancellationReason(reason);
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
                appointment.getStartTime(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getType(),
                appointment.getLocation(),
                appointment.getMeetingLink(),
                reason
            );

            emailService.sendAppointmentStatusEmail(
                patient.getEmail(),
                patient.getFullName(),
                "CANCELLED",
                appointment.getStartTime(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getType(),
                appointment.getLocation(),
                appointment.getMeetingLink(),
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

        appointment.setStatus("COMPLETED");
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
                appointment.getStartTime(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getType(),
                appointment.getLocation(),
                appointment.getMeetingLink(),
                null
            );
        } catch (MessagingException e) {
            // Log the error but don't fail the request
            e.printStackTrace();
        }

        return ResponseEntity.ok(AppointmentResponse.fromAppointment(appointment));
    }
} 