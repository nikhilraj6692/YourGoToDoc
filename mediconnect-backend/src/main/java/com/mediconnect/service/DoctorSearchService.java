package com.mediconnect.service;

import com.mediconnect.dto.doctor.DoctorSearchResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DoctorSearchService {
    /**
     * Search for doctors based on various criteria
     * @param specialization Doctor's specialization
     * @param minExperience Minimum years of experience
     * @param city City name
     * @param state State name
     * @param pincode Pincode
     * @param latitude Latitude for location-based search
     * @param longitude Longitude for location-based search
     * @param radius Search radius in kilometers
     * @param pageable Pagination information
     * @return Page of doctor profiles matching the search criteria
     */
    Page<DoctorSearchResponse> searchDoctors(String name,
        String specialization,
        Integer minExperience,
        String city,
        String state,
        String pincode,
        Double latitude,
        Double longitude,
        Double radius,
        Pageable pageable
    );

}