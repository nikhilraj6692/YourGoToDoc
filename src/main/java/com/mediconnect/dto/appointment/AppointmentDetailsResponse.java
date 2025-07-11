package com.mediconnect.dto.appointment;

import com.mediconnect.model.AppointmentDetails;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Appointment details response payload")
public class AppointmentDetailsResponse {
    
    @Schema(description = "Unique identifier of the appointment details", example = "details123")
    private String id;

    @Schema(description = "ID of the appointment", example = "appt123")
    private String appointmentId;

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

    @Schema(description = "Timestamp when the appointment details were created", example = "1646092800000")
    private Long createdAt;

    @Schema(description = "Timestamp when the appointment details were last updated", example = "1646092800000")
    private Long updatedAt;

    public static AppointmentDetailsResponse fromAppointmentDetails(AppointmentDetails details) {
        AppointmentDetailsResponse response = new AppointmentDetailsResponse();
        response.setId(details.getId());
        response.setAppointmentId(details.getAppointmentId());
        response.setTransactionId(details.getTransactionId());
        response.setSymptoms(details.getSymptoms());
        response.setAllergies(details.getAllergies());
        response.setFiles(details.getFiles());
        response.setChiefComplaint(details.getChiefComplaint());
        response.setSymptomDuration(details.getSymptomDuration());
        response.setPainLevel(details.getPainLevel());
        response.setCurrentMedications(details.getCurrentMedications());
        response.setMedicalHistory(details.getMedicalHistory());
        response.setAdditionalNotes(details.getAdditionalNotes());
        response.setDiagnosis(details.getDiagnosis());
        response.setPrescription(details.getPrescription());
        response.setTreatmentPlan(details.getTreatmentPlan());
        response.setFollowUpNotes(details.getFollowUpNotes());
        response.setPatientPhone(details.getPatientPhone());
        response.setPatientEmergencyContact(details.getPatientEmergencyContact());
        response.setCreatedAt(details.getCreatedAt());
        response.setUpdatedAt(details.getUpdatedAt());
        return response;
    }
} 