package com.mediconnect.dto.appointment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Appointment details request payload")
public class AppointmentDetailsRequest {
    
    @Schema(description = "Transaction ID for payment tracking", example = "txn_123456789")
    private String transactionId;

    @Schema(description = "List of symptoms reported by patient", example = "[\"Fever\", \"Cough\", \"Headache\"]")
    private List<String> symptoms;

    @Schema(description = "List of patient allergies", example = "[\"Penicillin\", \"Peanuts\"]")
    private List<String> allergies;

    @Schema(description = "List of file URLs or IDs attached to appointment", example = "[\"file1.pdf\", \"file2.jpg\"]")
    private List<String> files;

    @Schema(description = "Patient's chief complaint", example = "Severe headache for 3 days")
    private String chiefComplaint;

    @Schema(description = "Duration of symptoms", example = "3 days")
    private String symptomDuration;

    @Schema(description = "Pain level (0-10)", example = "7")
    private Integer painLevel;

    @Schema(description = "Current medications", example = "Paracetamol, Ibuprofen")
    private String currentMedications;

    @Schema(description = "Medical history", example = "Diabetes, Hypertension")
    private String medicalHistory;

    @Schema(description = "Additional notes", example = "Patient prefers morning appointments")
    private String additionalNotes;

    @Schema(description = "Doctor's diagnosis", example = "Common cold")
    private String diagnosis;

    @Schema(description = "Prescription details", example = "Paracetamol 500mg twice daily")
    private String prescription;

    @Schema(description = "Treatment plan", example = "Rest, fluids, follow up in 1 week")
    private String treatmentPlan;

    @Schema(description = "Follow-up notes", example = "Schedule follow-up appointment")
    private String followUpNotes;

    @Schema(description = "Patient's phone number for this appointment", example = "+1234567890")
    private String patientPhone;

    @Schema(description = "Patient's emergency contact for this appointment", example = "Jane Doe - +1234567890")
    private String patientEmergencyContact;
} 