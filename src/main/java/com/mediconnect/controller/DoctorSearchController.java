package com.mediconnect.controller;

import com.mediconnect.dto.doctor.DoctorSearchResponse;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.service.DoctorSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors/search")
@Tag(name = "Doctor Search", description = "APIs for searching doctors")
@PreAuthorize("hasRole('PATIENT')")
public class DoctorSearchController {

    @Autowired
    private DoctorSearchService doctorSearchService;

    @GetMapping
    @Operation(summary = "Search doctors", description = "Search doctors by specialization, experience, and location")
    public ResponseEntity<Page<DoctorSearchResponse>> searchDoctors(
            @Parameter(description = "Doctor's specialization") @RequestParam(required = false) String specialization,
            @Parameter(description = "Minimum years of experience") @RequestParam(required = false) Integer minExperience,
            @Parameter(description = "City name") @RequestParam(required = false) String city,
            @Parameter(description = "State name") @RequestParam(required = false) String state,
            @Parameter(description = "Pincode") @RequestParam(required = false) String pincode,
            @Parameter(description = "Latitude") @RequestParam(required = false) Double latitude,
            @Parameter(description = "Longitude") @RequestParam(required = false) Double longitude,
            @Parameter(description = "Search radius in kilometers") @RequestParam(defaultValue = "50.0") Double radius,
            @Parameter(description = "Doctor name for search") @RequestParam(required = false) String name,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        // Otherwise use the existing search logic
        Page<DoctorSearchResponse> doctors = doctorSearchService.searchDoctors(name,
            specialization,
            minExperience,
            city,
            state,
            pincode,
            latitude,
            longitude,
            radius,
            pageable
        );

        return ResponseEntity.ok(doctors);
    }

    private Page<DoctorSearchResponse> convertToSearchResponse(Page<DoctorProfile> doctors) {
        // Implementation of convertToSearchResponse method
        return null; // Placeholder return, actual implementation needed
    }
} 