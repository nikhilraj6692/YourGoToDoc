package com.mediconnect.dto.appointment;

import com.mediconnect.enums.AppointmentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Schema(description = "Appointment request payload")
public class AppointmentRequest {
    @NotBlank(message = "Doctor ID is required")
    @Schema(description = "ID of the doctor", example = "doctor123")
    private String doctorId;

    @NotNull(message = "Date is required")
    @Schema(description = "Date of the appointment")
    private LocalDate date;

    @NotBlank(message = "Calendar ID is required")
    @Schema(description = "ID of the calendar", example = "calendar123")
    private String calendarId;

    @NotBlank(message = "Slot ID is required")
    @Schema(description = "ID of the slot", example = "slot123")
    private String slotId;

    @NotBlank(message = "Appointment type is required")
    @Schema(description = "Type of appointment", example = "VIDEO", allowableValues = {"ONLINE"})
    private String type;

    @Schema(description = "Reason for the appointment/reschedule etc.", example = "Regular checkup")
    private String reason;

    @Schema(description = "Additional notes for the appointment", example = "First consultation")
    private String notes;
} 