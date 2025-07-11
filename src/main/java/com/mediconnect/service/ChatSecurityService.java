package com.mediconnect.service;

import com.mediconnect.enums.AppointmentStatus;
import com.mediconnect.enums.UserRole;
import com.mediconnect.model.Appointment;
import com.mediconnect.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatSecurityService {
    
    private final AppointmentRepository appointmentRepository;
    
    /**
     * Validates if a user has access to chat for a specific appointment
     */
    public boolean validateMessageAccess(String appointmentId, String userId, UserRole role) {
        try {
            // 1. Check if appointment exists
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElse(null);
            
            if (appointment == null) {
                log.warn("Appointment not found: {}", appointmentId);
                return false;
            }
            
            // 2. Validate user is participant
            if (role == UserRole.PATIENT) {
                boolean hasAccess = appointment.getPatientId().equals(userId);
                if (!hasAccess) {
                    log.warn("Patient {} not authorized for appointment {}", userId, appointmentId);
                }
                return hasAccess;
            } else if (role == UserRole.DOCTOR) {
                boolean hasAccess = appointment.getDoctorId().equals(userId);
                if (!hasAccess) {
                    log.warn("Doctor {} not authorized for appointment {}", userId, appointmentId);
                }
                return hasAccess;
            }
            
            log.warn("Invalid user role: {} for user: {}", role, userId);
            return false;
            
        } catch (Exception e) {
            log.error("Error validating message access for appointment: {}, user: {}", appointmentId, userId, e);
            return false;
        }
    }
    
    /**
     * Validates if appointment status allows chat
     */
    public boolean validateAppointmentStatus(String appointmentId) {
        try {
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElse(null);
            
            if (appointment == null) {
                log.warn("Appointment not found: {}", appointmentId);
                return false;
            }
            
            // Only allow chat for CONFIRMED appointments
            boolean isConfirmed = AppointmentStatus.CONFIRMED==appointment.getStatus();
            
            if (!isConfirmed) {
                log.warn("Appointment {} not confirmed, status: {}", appointmentId, appointment.getStatus());
            }
            
            return isConfirmed;
            
        } catch (Exception e) {
            log.error("Error validating appointment status: {}", appointmentId, e);
            return false;
        }
    }
    
    /**
     * Comprehensive validation for chat access
     */
    public boolean validateChatAccess(String appointmentId, String userId, UserRole role) {
        return validateAppointmentStatus(appointmentId) && 
               validateMessageAccess(appointmentId, userId, role);
    }
    
    /**
     * Gets appointment details for validation
     */
    public Appointment getAppointmentForValidation(String appointmentId) {
        return appointmentRepository.findById(appointmentId).orElse(null);
    }
} 