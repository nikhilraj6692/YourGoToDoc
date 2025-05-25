package com.mediconnect.dto.appointment;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Appointment request payload")
public class AppointmentRequest {
    @NotBlank(message = "Doctor ID is required")
    @Schema(description = "ID of the doctor", example = "doctor123")
    private String doctorId;

    @NotNull(message = "Start time is required")
    @Schema(description = "Start time of the appointment in milliseconds", example = "1646092800000")
    private Long startTime;

    @NotNull(message = "End time is required")
    @Schema(description = "End time of the appointment in milliseconds", example = "1646096400000")
    private Long endTime;

    @NotBlank(message = "Appointment type is required")
    @Schema(description = "Type of appointment", example = "VIDEO", allowableValues = {"IN_PERSON", "VIDEO", "PHONE"})
    private String type;

    @Schema(description = "Reason for the appointment", example = "Regular checkup")
    private String reason;

    @Schema(description = "Additional notes for the appointment", example = "First consultation")
    private String notes;

    @Schema(description = "Location for in-person appointments", example = "Room 101, Medical Center")
    private String location;
} 