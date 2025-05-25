package com.mediconnect.dto.admin;

import com.mediconnect.enums.VerificationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Doctor verification request from admin")
public class DoctorVerificationRequest {

    @Schema(description = "Verification status", example = "VERIFIED", required = true)
    @NotNull(message = "Verification status is required")
    private VerificationStatus status;

    @Schema(description = "Reason for rejection (required if status is REJECTED)")
    private String reason;



} 