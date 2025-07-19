package com.mediconnect.dto.doctor;

import com.mediconnect.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Doctor registration response")
public class DoctorRegistrationResponse {
    @Schema(description = "JWT token")
    private String token;

    @Schema(description = "User information")
    private User user;

    @Schema(description = "Doctor's profile information")
    private DoctorProfileResponse doctorProfile;
} 