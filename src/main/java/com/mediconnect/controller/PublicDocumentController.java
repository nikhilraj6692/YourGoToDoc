package com.mediconnect.controller;

import com.mediconnect.enums.UserRole;
import com.mediconnect.service.AppS3Client;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.flogger.Flogger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/documents")
@Tag(name = "Public Document Access", description = "Public APIs for accessing documents without authentication")
@Slf4j
public class PublicDocumentController {

    private final AppS3Client appS3Client;
    private final UserRepository userRepository;

    public PublicDocumentController(AppS3Client appS3Client, UserRepository userRepository) {
        this.appS3Client = appS3Client;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Download document by ID", description = "Downloads a document from S3 using document ID (public access)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document downloaded successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{documentId}")
    public ResponseEntity<?> downloadDocumentById(@PathVariable String documentId) {
        try {
            // Find user by profile photo ID
            User user = userRepository.findByProfilePhotoId(documentId)
                .orElse(null);
            
            if (user == null || user.getProfilePhotoUrl() == null) {
                return ResponseEntity.notFound().build();
            }

            // Check if user is a doctor
            if (!UserRole.DOCTOR.equals(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: Only doctor profile photos are publicly accessible");
            }

            // Extract the key from the URL
            String key = user.getProfilePhotoUrl().substring(user.getProfilePhotoUrl().lastIndexOf("/") + 1);
            byte[] fileBytes = appS3Client.downloadFile(URLDecoder.decode(key));
            
            // Determine content type based on file extension
            String contentType = determineContentType(key);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("inline", key);
            
            return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Exception occurred", e);
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