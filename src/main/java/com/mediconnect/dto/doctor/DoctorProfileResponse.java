package com.mediconnect.dto.doctor;

import com.mediconnect.enums.VerificationStatus;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.Address;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.mediconnect.enums.DocumentType;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Doctor profile information")
public class DoctorProfileResponse {
    @Schema(description = "Doctor's full name", example = "Dr. John Smith")
    private String fullName;

    @Schema(description = "Doctor's specialization", example = "Cardiology")
    private String specialization;

    @Schema(description = "Doctor's license number", example = "MD123456")
    private String licenseNumber;

    @Schema(description = "Years of experience", example = "10")
    private Integer yearsOfExperience;

    @Schema(description = "Doctor's phone number", example = "+1234567890")
    private Long phoneNumber;

    @Schema(description = "Doctor's address")
    private Address address;

    @Schema(description = "Doctor's bio", example = "Experienced cardiologist with expertise in...")
    private String bio;

    @Schema(description = "Verification status", example = "PENDING")
    private VerificationStatus verificationStatus;

    @Schema(description = "Profile photo document ID")
    private String profilePhotoId;

    private String email;

    @Schema(description = "Uploaded documents mapped by type")
    private Map<DocumentType, com.mediconnect.model.DoctorProfile.UploadedDocument> documents;

    private String statusReason;
} 