package com.mediconnect.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Document(collection = "appointment_details")
public class AppointmentDetails {
    @Id
    private String id;

    private String appointmentId; // Reference to the appointment
    
    // Transaction and payment info
    private String transactionId;
    
    // Medical information
    private List<String> symptoms;
    private List<String> allergies;
    private List<String> files; // File URLs or IDs
    
    // Patient medical information
    private String chiefComplaint;
    private String symptomDuration;
    private Integer painLevel;
    private String currentMedications;
    private String medicalHistory;
    private String additionalNotes;
    
    // Doctor's medical notes
    private String diagnosis;
    private String prescription;
    private String treatmentPlan;
    private String followUpNotes;
    
    // Contact information that may change for this appointment
    private String patientPhone;
    private String patientEmergencyContact;
    
    // Timestamps
    private Long createdAt;
    private Long updatedAt;
    
    // Constructor
    public AppointmentDetails() {
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = this.createdAt;
    }
} 