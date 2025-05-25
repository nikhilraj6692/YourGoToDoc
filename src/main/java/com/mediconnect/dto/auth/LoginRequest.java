package com.mediconnect.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Login request payload")
public class LoginRequest {
    @NotBlank
    @Email
    @Schema(description = "User email", example = "user@example.com")
    private String email;

    @NotBlank
    @Schema(description = "User password", example = "password123")
    private String password;
} 