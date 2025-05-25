package com.mediconnect.controller;

import com.mediconnect.service.AppS3Client;
import com.mediconnect.repository.DoctorProfileRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import com.mediconnect.enums.DocumentType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/s3")
@Tag(name = "S3 Operations", description = "APIs for S3 file operations")
public class S3Controller {

    private final AppS3Client appS3Client;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;

    public S3Controller(AppS3Client appS3Client, 
                       DoctorProfileRepository doctorProfileRepository,
                       UserRepository userRepository) {
        this.appS3Client = appS3Client;
        this.doctorProfileRepository = doctorProfileRepository;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Download document", description = "Downloads a document from S3 using doctor ID and document type")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document downloaded successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/documents/{doctorId}/{documentType}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<?> downloadDocument(
            @PathVariable String doctorId,
            @PathVariable String documentType) {
        try {
            DoctorProfile doctorProfile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

            String key = "";
            // Handle PROFILE_PHOTO type
            if (DocumentType.valueOf(documentType) == DocumentType.PROFILE_PHOTO) {
                User user = userRepository.findById(doctorProfile.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                if (user.getProfilePhotoUrl() == null) {
                    return ResponseEntity.notFound().build();
                }

                key = user.getProfilePhotoUrl().substring(user.getProfilePhotoUrl().lastIndexOf("/") + 1);

            } else {

                // Handle other document types
                DoctorProfile.UploadedDocument document = doctorProfile.getDocuments().get(DocumentType.valueOf(documentType));
                if (document == null) {
                    return ResponseEntity.notFound().build();
                }

                key = document.getUrl().substring(document.getUrl().lastIndexOf("/") + 1);
            }
            byte[] fileBytes = appS3Client.downloadFile(URLDecoder.decode(key));
            
            // Determine content type based on file extension
            String contentType = determineContentType(key);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("inline", key);
            
            return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to download file: " + e.getMessage());
        }
    }

    private String determineContentType(String fileName) {
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        switch (extension) {
            case "pdf":
                return "application/pdf";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default:
                return "application/octet-stream";
        }
    }
} 