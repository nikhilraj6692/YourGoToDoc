package com.mediconnect.repository;

import com.mediconnect.model.AppointmentDetails;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppointmentDetailsRepository extends MongoRepository<AppointmentDetails, String> {
    
    /**
     * Find appointment details by appointment ID
     * @param appointmentId the appointment ID
     * @return Optional containing appointment details if found
     */
    Optional<AppointmentDetails> findByAppointmentId(String appointmentId);
} 