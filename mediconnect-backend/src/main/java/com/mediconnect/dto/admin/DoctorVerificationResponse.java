package com.mediconnect.dto.admin;

import com.mediconnect.dto.doctor.DoctorProfileResponse;
import com.mediconnect.enums.VerificationStatus;
import com.mediconnect.model.DoctorProfile;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Doctor verification response")
public class DoctorVerificationResponse {
    @Schema(description = "Doctor's profile information")
    private DoctorProfileResponse doctorProfile;

    @Schema(description = "Verification status", example = "VERIFIED")
    private VerificationStatus verificationStatus;

    @Schema(description = "Reason for rejection (if status is REJECTED)")
    private String rejectionReason;

    @Schema(description = "Verification timestamp")
    private LocalDateTime verifiedAt;
} 