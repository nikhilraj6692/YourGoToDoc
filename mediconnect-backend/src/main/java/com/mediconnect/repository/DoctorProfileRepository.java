package com.mediconnect.repository;

import com.mediconnect.model.DoctorProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.mediconnect.enums.VerificationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends MongoRepository<DoctorProfile, String> {
    Optional<DoctorProfile> findByUserId(String userId);
    boolean existsByLicenseNumber(String licenseNumber);
    List<DoctorProfile> findByVerificationStatus(VerificationStatus status);
} 