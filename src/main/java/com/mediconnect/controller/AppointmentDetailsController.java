package com.mediconnect.controller;

import com.mediconnect.dto.appointment.AppointmentDetailsRequest;
import com.mediconnect.dto.appointment.AppointmentDetailsResponse;
import com.mediconnect.enums.UserRole;
import com.mediconnect.model.Appointment;
import com.mediconnect.model.AppointmentDetails;
import com.mediconnect.model.User;
import com.mediconnect.repository.AppointmentDetailsRepository;
import com.mediconnect.repository.AppointmentRepository;
import com.mediconnect.service.UserService;
import com.mediconnect.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointment-details")
@Tag(name = "Appointment Details Management", description = "APIs for managing appointment details")
public class AppointmentDetailsController {

    @Autowired
    private AppointmentDetailsRepository appointmentDetailsRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserService userService;

    @GetMapping("/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Get appointment details", description = "Retrieves detailed information for a specific appointment")
    public ResponseEntity<AppointmentDetailsResponse> getAppointmentDetails(@PathVariable String appointmentId) {
        // First verify the appointment exists and user has access
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        String userEmail = UserContext.getCurrentUserEmail();

        User user = userService.findByEmail(userEmail);
        if(null == user) {
            throw new RuntimeException("User not found");
        }

        if(user.getRole() == UserRole.DOCTOR && !appointment.getDoctorId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if(user.getRole() == UserRole.PATIENT && !appointment.getPatientId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Get appointment details
        AppointmentDetails details = appointmentDetailsRepository.findByAppointmentId(appointmentId)
                .orElse(null);

        if (details == null) {
            // Return empty response if no details exist yet
            return ResponseEntity.ok(new AppointmentDetailsResponse());
        }

        return ResponseEntity.ok(AppointmentDetailsResponse.fromAppointmentDetails(details));
    }

    @PostMapping("/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Create or update appointment details", description = "Creates or updates detailed information for a specific appointment")
    public ResponseEntity<AppointmentDetailsResponse> createOrUpdateAppointmentDetails(
            @PathVariable String appointmentId,
            @RequestBody AppointmentDetailsRequest request) {
        
        // First verify the appointment exists
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        String userEmail = UserContext.getCurrentUserEmail();

        User user = userService.findByEmail(userEmail);
        if(null == user) {
            throw new RuntimeException("User not found");
        }

        if(user.getRole() == UserRole.DOCTOR && !appointment.getDoctorId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if(user.getRole() == UserRole.PATIENT && !appointment.getPatientId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Check if appointment details already exist
        AppointmentDetails details = appointmentDetailsRepository.findByAppointmentId(appointmentId)
                .orElse(new AppointmentDetails());

        // Update or create appointment details
        if (details.getId() == null) {
            // New appointment details
            details.setAppointmentId(appointmentId);
        }

        // Update fields from request
        if (request.getTransactionId() != null) {
            details.setTransactionId(request.getTransactionId());
        }
        if (request.getSymptoms() != null) {
            details.setSymptoms(request.getSymptoms());
        }
        if (request.getAllergies() != null) {
            details.setAllergies(request.getAllergies());
        }
        if (request.getFiles() != null) {
            details.setFiles(request.getFiles());
        }
        if (request.getDiagnosis() != null) {
            details.setDiagnosis(request.getDiagnosis());
        }
        if (request.getPrescription() != null) {
            details.setPrescription(request.getPrescription());
        }
        if (request.getTreatmentPlan() != null) {
            details.setTreatmentPlan(request.getTreatmentPlan());
        }
        if (request.getFollowUpNotes() != null) {
            details.setFollowUpNotes(request.getFollowUpNotes());
        }
        if (request.getPatientPhone() != null) {
            details.setPatientPhone(request.getPatientPhone());
        }
        if (request.getPatientEmergencyContact() != null) {
            details.setPatientEmergencyContact(request.getPatientEmergencyContact());
        }
        // New patient info fields
        if (request.getChiefComplaint() != null) {
            details.setChiefComplaint(request.getChiefComplaint());
        }
        if (request.getSymptomDuration() != null) {
            details.setSymptomDuration(request.getSymptomDuration());
        }
        if (request.getPainLevel() != null) {
            details.setPainLevel(request.getPainLevel());
        }
        if (request.getCurrentMedications() != null) {
            details.setCurrentMedications(request.getCurrentMedications());
        }
        if (request.getMedicalHistory() != null) {
            details.setMedicalHistory(request.getMedicalHistory());
        }
        if (request.getAdditionalNotes() != null) {
            details.setAdditionalNotes(request.getAdditionalNotes());
        }

        details.setUpdatedAt(System.currentTimeMillis());
        details = appointmentDetailsRepository.save(details);

        return ResponseEntity.ok(AppointmentDetailsResponse.fromAppointmentDetails(details));
    }

    @PutMapping("/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Update appointment details", description = "Updates existing appointment details")
    public ResponseEntity<AppointmentDetailsResponse> updateAppointmentDetails(
            @PathVariable String appointmentId,
            @RequestBody AppointmentDetailsRequest request) {
        
        // First verify the appointment exists
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        String userEmail = UserContext.getCurrentUserEmail();

        User user = userService.findByEmail(userEmail);
        if(null == user) {
            throw new RuntimeException("User not found");
        }

        if(user.getRole() == UserRole.DOCTOR && !appointment.getDoctorId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if(user.getRole() == UserRole.PATIENT && !appointment.getPatientId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Get existing appointment details
        AppointmentDetails details = appointmentDetailsRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment details not found"));

        // Update fields from request
        if (request.getTransactionId() != null) {
            details.setTransactionId(request.getTransactionId());
        }
        if (request.getSymptoms() != null) {
            details.setSymptoms(request.getSymptoms());
        }
        if (request.getAllergies() != null) {
            details.setAllergies(request.getAllergies());
        }
        if (request.getFiles() != null) {
            details.setFiles(request.getFiles());
        }
        if (request.getDiagnosis() != null) {
            details.setDiagnosis(request.getDiagnosis());
        }
        if (request.getPrescription() != null) {
            details.setPrescription(request.getPrescription());
        }
        if (request.getTreatmentPlan() != null) {
            details.setTreatmentPlan(request.getTreatmentPlan());
        }
        if (request.getFollowUpNotes() != null) {
            details.setFollowUpNotes(request.getFollowUpNotes());
        }
        if (request.getPatientPhone() != null) {
            details.setPatientPhone(request.getPatientPhone());
        }
        if (request.getPatientEmergencyContact() != null) {
            details.setPatientEmergencyContact(request.getPatientEmergencyContact());
        }
        // New patient info fields
        if (request.getChiefComplaint() != null) {
            details.setChiefComplaint(request.getChiefComplaint());
        }
        if (request.getSymptomDuration() != null) {
            details.setSymptomDuration(request.getSymptomDuration());
        }
        if (request.getPainLevel() != null) {
            details.setPainLevel(request.getPainLevel());
        }
        if (request.getCurrentMedications() != null) {
            details.setCurrentMedications(request.getCurrentMedications());
        }
        if (request.getMedicalHistory() != null) {
            details.setMedicalHistory(request.getMedicalHistory());
        }
        if (request.getAdditionalNotes() != null) {
            details.setAdditionalNotes(request.getAdditionalNotes());
        }

        details.setUpdatedAt(System.currentTimeMillis());
        details = appointmentDetailsRepository.save(details);

        return ResponseEntity.ok(AppointmentDetailsResponse.fromAppointmentDetails(details));
    }

    @DeleteMapping("/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Delete appointment details", description = "Deletes appointment details for a specific appointment")
    public ResponseEntity<Void> deleteAppointmentDetails(@PathVariable String appointmentId) {
        // First verify the appointment exists
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Get existing appointment details
        AppointmentDetails details = appointmentDetailsRepository.findByAppointmentId(appointmentId)
                .orElse(null);

        if (details != null) {
            appointmentDetailsRepository.delete(details);
        }

        return ResponseEntity.noContent().build();
    }
} 