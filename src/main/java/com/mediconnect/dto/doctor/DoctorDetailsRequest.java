package com.mediconnect.dto.doctor;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@Schema(description = "Doctor registration request payload")
public class DoctorDetailsRequest {
    @Schema(description = "Doctor's specialization", example = "Cardiology", required = true)
    @NotBlank(message = "Specialization is required")
    private String specialization;

    @Schema(description = "Doctor's license number", example = "MD123456", required = true)
    @NotBlank(message = "License number is required")
    private String licenseNumber;

    @Schema(description = "Years of experience", example = "10", required = true)
    @Min(value = 0, message = "Experience years cannot be negative")
    @Max(value = 100, message = "Experience years seems unrealistic")
    private Integer yearsOfExperience;

    @Schema(description = "Doctor's address", example = "123 Medical Center Dr, Suite 100", required = true)
    @NotBlank(message = "Address is required")
    private String address;

    @Schema(description = "Doctor's bio", example = "Experienced cardiologist with expertise in...")
    private String bio;
} 