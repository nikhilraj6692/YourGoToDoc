package com.mediconnect.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Authentication response")
public class AuthResponse {
    @Schema(description = "JWT access token")
    private String accessToken;
    @Schema(description = "JWT refresh token")
    private String refreshToken;
    @Schema(description = "User information")
    private UserDto user;

    // Constructor for backward compatibility
    public AuthResponse(String token, UserDto user) {
        this.accessToken = token;
        this.refreshToken = null;
        this.user = user;
    }
} 