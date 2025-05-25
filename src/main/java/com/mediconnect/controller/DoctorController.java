package com.mediconnect.controller;

import com.mediconnect.dto.doctor.DoctorProfileResponse;
import com.mediconnect.enums.DocumentType;
import com.mediconnect.enums.VerificationStatus;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import com.mediconnect.repository.DoctorProfileRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.service.FileStorageService;
import com.mediconnect.service.AppS3Client;
import com.mediconnect.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
@Tag(name = "Doctor Management", description = "Doctor registration and profile management APIs")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorController {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final FileStorageService fileStorageService;
    private final AppS3Client appS3Client;

    @Value("${file.allowed-types}")
    private String allowedFileTypesStr;

    @Value("${file.max-size}")
    private long maxFileSize;

    private List<String> getAllowedFileTypes() {
        return Arrays.asList(allowedFileTypesStr.split(","));
    }

    public DoctorController(
                          UserRepository userRepository,
                          DoctorProfileRepository doctorProfileRepository,
                          FileStorageService fileStorageService,
                          AppS3Client appS3Client) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.fileStorageService = fileStorageService;
        this.appS3Client = appS3Client;
    }

    @Operation(summary = "Get doctor profile", description = "Retrieves the profile of the authenticated doctor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = DoctorProfileResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    @GetMapping("/profile")
    public ResponseEntity<?> getDoctorProfile() {
        String userEmail = UserContext.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        DoctorProfileResponse profileResponse = new DoctorProfileResponse(
            user.getFullName(),
            doctorProfile.getSpecialization(),
            doctorProfile.getLicenseNumber(),
            doctorProfile.getYearsOfExperience(),
            user.getPhoneNumber(),
            user.getAddress(),
            doctorProfile.getBio(),
            doctorProfile.getVerificationStatus(),
            user.getProfilePhotoId(),
            user.getEmail(),
            doctorProfile.getDocuments(),
            null!=doctorProfile.getReasons() && !doctorProfile.getReasons().isEmpty() ? doctorProfile.getReasons().get(0).getReason() : ""
        );

        return ResponseEntity.ok(profileResponse);
    }

    @Operation(summary = "Update doctor profile", description = "Updates the profile of the authenticated doctor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile updated successfully",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = DoctorProfileResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Profile not found")
    })
    @PutMapping("/profile")
    public ResponseEntity<?> updateDoctorProfile(@Valid @RequestBody DoctorProfileResponse profile) {
        String userEmail = UserContext.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        doctorProfile.setSpecialization(profile.getSpecialization());
        doctorProfile.setYearsOfExperience(profile.getYearsOfExperience());
        doctorProfile.setBio(profile.getBio());
        doctorProfile.setLicenseNumber(profile.getLicenseNumber());

        doctorProfileRepository.save(doctorProfile);

        user.setFullName(profile.getFullName());
        user.setPhoneNumber(profile.getPhoneNumber());
        user.setAddress(profile.getAddress());
        userRepository.save(user);

        return ResponseEntity.ok(profile);
    }

    @Operation(summary = "Upload verification document", description = "Uploads a verification document for the doctor's profile")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document uploaded successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid file type or size"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Doctor profile not found")
    })
    @PostMapping("/documents")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file,
                                            @RequestParam("documentType") DocumentType documentType) {
        String userEmail = UserContext.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
        try {
            String key = file.getOriginalFilename();
            String url = appS3Client.uploadFile(file, key);
            String documentId = UUID.randomUUID().toString();

            if (documentType == DocumentType.PROFILE_PHOTO) {
                // Save profile photo in User table
                user.setProfilePhotoUrl(url);
                user.setProfilePhotoId(documentId);
                userRepository.save(user);
            } else {
                // Save other documents in DoctorProfile
                DoctorProfile.UploadedDocument doc = new DoctorProfile.UploadedDocument();
                doc.setDocumentId(documentId);
                doc.setUrl(url);
                doc.setType(documentType);
                if (doctorProfile.getDocuments() == null) {
                    doctorProfile.setDocuments(new HashMap<>());
                }
                doctorProfile.getDocuments().put(documentType, doc);
                doctorProfileRepository.save(doctorProfile);
            }
            return ResponseEntity.ok(documentId);


        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to upload document: " + e.getMessage());
        }
    }

    @Operation(summary = "Download verification document", description = "Downloads a verification document from the doctor's profile")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document downloaded successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Document not found")
    })
    @GetMapping("/documents/{documentType}")
    public ResponseEntity<?> getDocument(
        @PathVariable String documentType,
        @RequestParam String documentId) {
        String userEmail = UserContext.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (documentType.equals("PROFILE_PHOTO")) {
            // Get profile photo from User table
            if (!documentId.equals(user.getProfilePhotoId())) {
                return ResponseEntity.notFound().build();
            }
            try {
                String key = user.getProfilePhotoUrl().substring(user.getProfilePhotoUrl().lastIndexOf("/") + 1);
                byte[] fileBytes = appS3Client.downloadFile(key);
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                headers.setContentDispositionFormData("attachment", key);
                return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to download file: " + e.getMessage());
            }
        } else {
            // Get other documents from DoctorProfile
            DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

            DoctorProfile.UploadedDocument document = doctorProfile.getDocuments().get(DocumentType.valueOf(documentType));
            if (document == null || !document.getDocumentId().equals(documentId)) {
                return ResponseEntity.notFound().build();
            }

            try {
                String key = document.getUrl().substring(document.getUrl().lastIndexOf("/") + 1);
                byte[] fileBytes = appS3Client.downloadFile(URLDecoder.decode(key));
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                headers.setContentDispositionFormData("attachment", key);
                return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to download file: " + e.getMessage());
            }
        }
    }
} 