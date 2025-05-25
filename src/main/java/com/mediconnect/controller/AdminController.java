package com.mediconnect.controller;

import com.mediconnect.dto.admin.DoctorVerificationRequest;
import com.mediconnect.dto.admin.DoctorVerificationResponse;
import com.mediconnect.dto.doctor.DoctorProfileResponse;
import com.mediconnect.enums.DocumentType;
import com.mediconnect.enums.VerificationStatus;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import com.mediconnect.repository.DoctorProfileRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Management", description = "Admin dashboard and management APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public AdminController(DoctorProfileRepository doctorProfileRepository,
                         UserRepository userRepository,
                         EmailService emailService) {
        this.doctorProfileRepository = doctorProfileRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Operation(summary = "Get doctors by verification status", description = "Retrieves a list of doctors filtered by their verification status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Doctors retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    @GetMapping("/doctors/approvals")
    public ResponseEntity<?> getDoctorsByStatus(@RequestParam VerificationStatus status) {
        List<DoctorProfile> doctorProfiles = doctorProfileRepository.findByVerificationStatus(status);
        
        List<Map<String, Object>> doctorSummaries = doctorProfiles.stream()
            .map(profile -> {
                User user = userRepository.findById(profile.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                Map<String, Object> summary = new HashMap<>();
                summary.put("id", profile.getId());
                summary.put("name", user.getFullName());
                summary.put("specialty", profile.getSpecialization());
                String location = Optional.ofNullable(user.getAddress())
                        .map(address -> Stream.of(address.getCity(), address.getState())
                                .filter(Objects::nonNull)
                                .filter(s -> !s.trim().isEmpty())
                                .collect(Collectors.joining(", ")))
                        .orElse("");
                summary.put("location", location);
                summary.put("experience", profile.getYearsOfExperience());
                summary.put("submittedDate", profile.getCreatedAt());
                summary.put("lastUpdated", profile.getUpdatedAt());
                summary.put("verifiedAt", profile.getVerifiedAt());
                
                return summary;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(doctorSummaries);
    }

    @Operation(summary = "Get doctor profile details", description = "Retrieves detailed profile information for a specific doctor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Doctor profile retrieved successfully",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = DoctorProfileResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
        @ApiResponse(responseCode = "404", description = "Doctor not found")
    })
    @GetMapping("/doctors/{id}")
    public ResponseEntity<?> getDoctorProfile(@PathVariable String id) {
        try {
            DoctorProfile doctorProfile = doctorProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

            User user = userRepository.findById(doctorProfile.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Transform documents map to only include availability status
            Map<DocumentType, Boolean> documentStatus = new HashMap<>();
            if (doctorProfile.getDocuments() != null) {
                doctorProfile.getDocuments().forEach((type, doc) -> 
                    documentStatus.put(type, doc != null && doc.getDocumentId() != null)
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("userId", user.getId());
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());
            response.put("phoneNumber", user.getPhoneNumber());
            response.put("address", user.getAddress());
            response.put("specialization", doctorProfile.getSpecialization());
            response.put("yearsOfExperience", doctorProfile.getYearsOfExperience());
            response.put("licenseNumber", doctorProfile.getLicenseNumber());
            response.put("bio", doctorProfile.getBio());
            response.put("verificationStatus", doctorProfile.getVerificationStatus());
            response.put("documents", documentStatus);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch doctor profile: " + e.getMessage());
        }
    }

    @Operation(summary = "Verify doctor profile", description = "Verifies or rejects a doctor's profile")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Doctor profile verification updated successfully",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = DoctorVerificationResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
        @ApiResponse(responseCode = "404", description = "Doctor profile not found")
    })
    @PostMapping("/doctors/verify/{doctorId}")
    public ResponseEntity<?> verifyDoctor(@PathVariable String doctorId, @Valid @RequestBody DoctorVerificationRequest request) {
        DoctorProfile doctorProfile = doctorProfileRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        // Get doctor's email
        User doctor = userRepository.findById(doctorProfile.getUserId())
                .orElseThrow(() -> new RuntimeException("Doctor user not found"));

        if (request.getStatus() == VerificationStatus.REJECTED
            && (request.getReason() == null || request.getReason().trim().isEmpty())) {
            return ResponseEntity.badRequest().body("Rejection reason is required when rejecting a profile");
        }

        doctorProfile.setVerificationStatus(VerificationStatus.valueOf(request.getStatus().name()));
        if (request.getStatus() == VerificationStatus.VERIFIED) {
            doctorProfile.setVerifiedAt(LocalDateTime.now());
        }
        doctorProfile.setReasons(new DoctorProfile.ReasonHistory(request.getReason(), LocalDateTime.now()));

        doctorProfileRepository.save(doctorProfile);

        // Send email notification
        try {
            emailService.sendVerificationStatusEmail(
                doctor.getEmail(),
                doctor.getFullName(),
                    String.valueOf(doctorProfile.getVerificationStatus()),
                null !=doctorProfile.getReasons()  && !doctorProfile.getReasons().isEmpty()?
                        doctorProfile.getReasons().get(0).getReason() : "Unknown"
            );
        } catch (MessagingException e) {
            // Log the error but don't fail the request
            System.err.println("Failed to send verification email: " + e.getMessage());
        }

        return ResponseEntity.ok().build();
    }
} 