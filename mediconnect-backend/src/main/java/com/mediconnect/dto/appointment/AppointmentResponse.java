package com.mediconnect.dto.appointment;

import com.mediconnect.enums.AppointmentStatus;
import com.mediconnect.enums.AppointmentType;
import com.mediconnect.model.Appointment;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Appointment response payload")
public class AppointmentResponse {
    @Schema(description = "Unique identifier of the appointment", example = "appt123")
    private String id;

    @Schema(description = "ID of the doctor", example = "doctor123")
    private String doctorId;

    @Schema(description = "ID of the patient", example = "patient123")
    private String patientId;

    @Schema(description = "ID of the calendar", example = "calendar123")
    private String calendarId;

    @Schema(description = "ID of the slot", example = "slot123")
    private String slotId;

    @Schema(description = "Start time of the appointment in milliseconds", example = "1646092800000")
    private LocalDateTime startTime;

    @Schema(description = "End time of the appointment in milliseconds", example = "1646096400000")
    private LocalDateTime endTime;

    @Schema(description = "Status of the appointment", example = "SCHEDULED", allowableValues = {"SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"})
    private AppointmentStatus status;

    @Schema(description = "Type of appointment", example = "VIDEO", allowableValues = {"IN_PERSON", "VIDEO", "PHONE"})
    private AppointmentType type;

    @Schema(description = "Reason for the appointment", example = "Regular checkup")
    private String reason;

    @Schema(description = "Additional notes for the appointment", example = "First consultation")
    private String notes;

    @Schema(description = "Meeting link for video consultations", example = "https://meet.google.com/abc-defg-hij")
    private String meetingLink;

    @Schema(description = "Timestamp when the appointment was created", example = "1646092800000")
    private Long createdAt;

    @Schema(description = "Timestamp when the appointment was last updated", example = "1646092800000")
    private Long updatedAt;

    @Schema(description = "Timestamp when the appointment was cancelled", example = "1646092800000")
    private Long cancelledAt;

    @Schema(description = "Reason for cancellation if the appointment was cancelled", example = "Patient requested cancellation")
    private String cancellationReason;

    // Patient information fields
    @Schema(description = "Patient's full name", example = "John Doe")
    private String patientName;

    // Doctor information fields
    @Schema(description = "Doctor's full name", example = "Dr. Sarah Wilson")
    private String doctorName;

    public static AppointmentResponse fromAppointment(Appointment appointment) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(appointment.getId());
        response.setDoctorId(appointment.getDoctorId());
        response.setPatientId(appointment.getPatientId());
        response.setCalendarId(appointment.getCalendarId());
        response.setSlotId(appointment.getSlotId());
        response.setStatus(appointment.getStatus());
        response.setType(appointment.getType());
        response.setReason(appointment.getReason());
        response.setCreatedAt(appointment.getCreatedAt());
        response.setUpdatedAt(appointment.getUpdatedAt());
        return response;
    }
} 