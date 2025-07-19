package com.mediconnect.service.impl;

import com.mediconnect.dto.doctor.DoctorSearchResponse;
import com.mediconnect.model.Calendar;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import com.mediconnect.repository.CalendarRepository;
import com.mediconnect.repository.DoctorSearchRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.service.DoctorSearchService;
import com.mediconnect.service.LocationService;
import io.micrometer.common.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorSearchServiceImpl implements DoctorSearchService {

    @Autowired
    private DoctorSearchRepository doctorSearchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationService locationService;
    @Autowired
    private CalendarRepository calendarRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public Page<DoctorSearchResponse> searchDoctors(
            String name,
            String specialization,
            Integer minExperience,
            String city,
            String state,
            String pincode,
            Double latitude,
            Double longitude,
            Double radius,
            Pageable pageable) {
        
        // If coordinates are provided, search by location
        if (latitude != null && longitude != null) {
            // Convert radius from km to meters for MongoDB query
            Double maxDistanceInMeters = radius * 1000;

            return getDoctorSearchResponses(specialization, minExperience, latitude, longitude, pageable, maxDistanceInMeters);
        }
        
        // If pincode is provided, get coordinates and search
        if (StringUtils.isNotBlank(pincode)) {
            try {
                var address = locationService.getLocationDetailsFromPincode(pincode);
                if (address.getLocation() != null) {
                    Double maxDistanceInMeters = (radius != null ? radius : 10.0) * 1000;
                    return getDoctorSearchResponses(specialization, minExperience,
                            address.getLocation().getY(), address.getLocation().getX(), pageable, maxDistanceInMeters);

                }
            } catch (Exception e) {
                // If geocoding fails, fall back to basic search
            }
        }
        
        // If city is provided, search by city
        if (StringUtils.isNotBlank(city) && StringUtils.isNotBlank(state)) {
            Page<DoctorProfile> doctors;
            if (StringUtils.isNotBlank(specialization)) {
                doctors = doctorSearchRepository.findByCityAndStateAndSpecialization(
                    city, state, specialization, pageable);
            } else {
                doctors = doctorSearchRepository.findByCityAndState(city, state , pageable);
            }
            return convertToSearchResponse(doctors);
        }

        
        // If only specialization and experience are provided
        if (specialization != null && minExperience != null) {
            Page<DoctorProfile> doctors = doctorSearchRepository.findBySpecializationAndMinExperience(
                specialization, minExperience, pageable);
            return convertToSearchResponse(doctors);
        }

        return convertToSearchResponse(new PageImpl<>(new ArrayList<>()));
    }

    private Page<DoctorSearchResponse> getDoctorSearchResponses(String specialization, Integer minExperience, Double latitude, Double longitude, Pageable pageable, Double maxDistanceInMeters) {
        Page<DoctorProfile> doctors;
        if (StringUtils.isNotBlank(specialization)) {
            doctors = doctorSearchRepository.findBySpecializationNearLocation(
                    specialization, minExperience, longitude, latitude, maxDistanceInMeters, pageable);
        } else {
            doctors = doctorSearchRepository.findByLocationNear(
                    longitude, latitude, maxDistanceInMeters, pageable);
        }
        return convertToSearchResponse(doctors);
    }

    private Page<DoctorSearchResponse> convertToSearchResponse(Page<DoctorProfile> doctors) {
        List<DoctorSearchResponse> responses = doctors.getContent().stream()
            .map(doctor -> {
                User user = userRepository.findById(doctor.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                return DoctorSearchResponse.fromDoctorProfile(user,
                    doctor, calculateTodaySlots(doctor.getUserId())
                );
            })
            .collect(Collectors.toList());
        
        return new PageImpl<>(responses, doctors.getPageable(), doctors.getTotalElements());
    }

    private int calculateTodaySlots(String doctorId) {
        LocalDate today = LocalDate.now();
        Optional<Calendar> calendarOpt = calendarRepository.findByDoctorIdAndDate(doctorId, today);

        if (calendarOpt.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();

        Calendar calendar = calendarOpt.get();
        return (int) calendar.getSlots().stream()
                .filter(slot  -> slot.isAvailable() && slot.getStartTime().isAfter(now))
                .count();
    }
} 