package com.mediconnect.controller;

import com.mediconnect.dto.auth.AuthResponse;
import com.mediconnect.dto.auth.LoginRequest;
import com.mediconnect.dto.auth.RefreshTokenRequest;
import com.mediconnect.dto.auth.RegisterRequest;
import com.mediconnect.dto.auth.UserDto;
import com.mediconnect.dto.common.StructuredErrorResponse;
import com.mediconnect.enums.Status;
import com.mediconnect.enums.UserRole;
import com.mediconnect.enums.ErrorCode;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import com.mediconnect.repository.DoctorProfileRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication management APIs")
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final DoctorProfileRepository doctorProfileRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider, DoctorProfileRepository doctorProfileRepository) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    @Operation(summary = "Login user", description = "Authenticates a user and returns a JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
            
            // Check if this is a booking context login and user is not a patient
            if ("booking".equals(loginRequest.getContext()) && user.getRole() != UserRole.PATIENT) {
                log.warn("Non-patient user attempted to login for booking context: {} with role: {}", 
                        loginRequest.getEmail(), user.getRole());
                return ResponseEntity.badRequest().body(StructuredErrorResponse.fromErrorCode(ErrorCode.PATIENT_ONLY_OPERATION));
            }

            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            UserDto userDto = new UserDto(
                    user.getId(),
                    user.getEmail(),
                    user.getRole(),
                    user.getFullName(),
                    user.getPhoneNumber(),
                    user.getAddress()
            );
            return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken, userDto));
        } catch (BadCredentialsException e) {
            log.warn("Login failed - Bad credentials for email: {}", loginRequest.getEmail());
            // This will be handled by GlobalExceptionHandler and return 401
            throw e;
        } catch (Exception e) {
            log.error("Login failed for email: {} - Error: {}", loginRequest.getEmail(), e.getMessage(), e);
            // Any other exception will be handled by GlobalExceptionHandler
            throw new RuntimeException("Login failed. Please try after some time.", e);
        }
    }

    @Operation(summary = "Register new user", description = "Creates a new user account and returns a JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Email already exists or invalid input")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.badRequest().body(StructuredErrorResponse.fromErrorCode(ErrorCode.EMAIL_ALREADY_EXISTS));
            }

            User user = new User();
            user.setFullName(registerRequest.getName());
            user.setPhoneNumber(Long.valueOf(registerRequest.getPhoneNumber()));
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setRole(UserRole.valueOf(registerRequest.getRole()));
            user.setStatus(Status.ACTIVE);

            userRepository.save(user);

            if(registerRequest.getRole().equals("DOCTOR")) {
                DoctorProfile doctor = new DoctorProfile();
                doctor.setUserId(user.getId());
                doctorProfileRepository.save(doctor);
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            registerRequest.getEmail(),
                            registerRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);
            UserDto userDto = new UserDto(
                    user.getId(),
                    user.getEmail(),
                    user.getRole(),
                    user.getFullName(),
                    user.getPhoneNumber(),
                    user.getAddress()
            );
            return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken, userDto));
        } catch (Exception e) {
            throw new RuntimeException("Registration failed. Please try after some time.", e);
        }
    }

    @Operation(summary = "Refresh access token", description = "Refreshes the access token using a valid refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid refresh token"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest refreshTokenRequest) {
        try {
            // Validate refresh token
            if (!tokenProvider.validateRefreshToken(refreshTokenRequest.getRefreshToken())) {
                throw new RuntimeException("Invalid refresh token");
            }

            // Get username from refresh token
            String username = tokenProvider.getUsernameFromToken(refreshTokenRequest.getRefreshToken());
            
            // Load user details
            User user = userRepository.findByEmail(username).orElse(null);
            if (user == null) {
                throw new RuntimeException("User not found");
            }

            // Create UserDetails object for authentication
            org.springframework.security.core.userdetails.UserDetails userDetails = 
                org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmail())
                    .password("") // Empty password for refresh token
                    .authorities(user.getRole().name())
                    .build();

            // Create authentication object with UserDetails
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null, // No password needed for refresh token
                    userDetails.getAuthorities()
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate new tokens (both access and refresh tokens are renewed)
            String newAccessToken = tokenProvider.generateAccessToken(authentication);
            String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

            UserDto userDto = new UserDto(
                    user.getId(),
                    user.getEmail(),
                    user.getRole(),
                    user.getFullName(),
                    user.getPhoneNumber(),
                    user.getAddress()
            );

            return ResponseEntity.ok(new AuthResponse(newAccessToken, newRefreshToken, userDto));
        } catch (Exception e) {
            throw new RuntimeException("Token refresh failed. Please try after some time.", e);
        }
    }
}