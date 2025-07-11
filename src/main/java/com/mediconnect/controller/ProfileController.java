package com.mediconnect.controller;

import com.mediconnect.dto.profile.ProfileResponse;
import com.mediconnect.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "Profile Management", description = "APIs for managing user profiles")
@PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(summary = "Get user profile", description = "Retrieves the profile of the authenticated user")
    public ResponseEntity<ProfileResponse> getUserProfile() {
        ProfileResponse profile = profileService.getCurrentUserProfile();
        return ResponseEntity.ok(profile);
    }
} 