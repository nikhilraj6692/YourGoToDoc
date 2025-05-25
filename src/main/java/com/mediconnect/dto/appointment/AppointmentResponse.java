package com.mediconnect.dto.appointment;

import com.mediconnect.model.Appointment;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Appointment response payload")
public class AppointmentResponse {
    @Schema(description = "Unique identifier of the appointment", example = "appt123")
    private String id;

    @Schema(description = "ID of the doctor", example = "doctor123")
    private String doctorId;

    @Schema(description = "ID of the patient", example = "patient123")
    private String patientId;

    @Schema(description = "Start time of the appointment in milliseconds", example = "1646092800000")
    private Long startTime;

    @Schema(description = "End time of the appointment in milliseconds", example = "1646096400000")
    private Long endTime;

    @Schema(description = "Status of the appointment", example = "SCHEDULED", allowableValues = {"SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"})
    private String status;

    @Schema(description = "Type of appointment", example = "VIDEO", allowableValues = {"IN_PERSON", "VIDEO", "PHONE"})
    private String type;

    @Schema(description = "Reason for the appointment", example = "Regular checkup")
    private String reason;

    @Schema(description = "Additional notes for the appointment", example = "First consultation")
    private String notes;

    @Schema(description = "Meeting link for video consultations", example = "https://meet.google.com/abc-defg-hij")
    private String meetingLink;

    @Schema(description = "Location for in-person appointments", example = "Room 101, Medical Center")
    private String location;

    @Schema(description = "Timestamp when the appointment was created", example = "1646092800000")
    private Long createdAt;

    @Schema(description = "Timestamp when the appointment was last updated", example = "1646092800000")
    private Long updatedAt;

    @Schema(description = "Timestamp when the appointment was cancelled", example = "1646092800000")
    private Long cancelledAt;

    @Schema(description = "Reason for cancellation if the appointment was cancelled", example = "Patient requested cancellation")
    private String cancellationReason;

    public static AppointmentResponse fromAppointment(Appointment appointment) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(appointment.getId());
        response.setDoctorId(appointment.getDoctorId());
        response.setPatientId(appointment.getPatientId());
        response.setStartTime(appointment.getStartTime());
        response.setEndTime(appointment.getEndTime());
        response.setStatus(appointment.getStatus());
        response.setType(appointment.getType());
        response.setReason(appointment.getReason());
        response.setNotes(appointment.getNotes());
        response.setMeetingLink(appointment.getMeetingLink());
        response.setLocation(appointment.getLocation());
        response.setCreatedAt(appointment.getCreatedAt());
        response.setUpdatedAt(appointment.getUpdatedAt());
        response.setCancelledAt(appointment.getCancelledAt());
        response.setCancellationReason(appointment.getCancellationReason());
        return response;
    }
} 