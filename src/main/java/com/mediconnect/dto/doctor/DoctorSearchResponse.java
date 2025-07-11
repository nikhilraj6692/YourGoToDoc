package com.mediconnect.dto.doctor;

import com.mediconnect.dto.AddressResponse;
import com.mediconnect.enums.VerificationStatus;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Doctor search result information")
public class DoctorSearchResponse {
    @Schema(description = "Doctor unique id")
    private String id;

    @Schema(description = "Doctor's full name", example = "Dr. John Smith")
    private String fullName;

    @Schema(description = "Doctor's specialization", example = "Cardiology")
    private String specialization;

    @Schema(description = "Years of experience", example = "10")
    private Integer yearsOfExperience;

    @Schema(description = "Doctor's address")
    private AddressResponse address;

    @Schema(description = "Doctor's bio", example = "Experienced cardiologist with expertise in...")
    private String bio;

    @Schema(description = "Profile photo document ID")
    private String profilePhotoId;

    @Schema(description = "Profile photo document ID")
    private Double consultationFee;

    @Schema(description = "Available slots")
    private int availableSlots;

    public static DoctorSearchResponse fromDoctorProfile(User user, DoctorProfile profile, int slots) {
        return new DoctorSearchResponse(
                user.getId(),
            user.getFullName(),
            profile.getSpecialization(),
            profile.getYearsOfExperience(),
            AddressResponse.fromAddress(user.getAddress()),
            profile.getBio(),
            user.getProfilePhotoId(),
                0D,
                slots
        );
    }
} 