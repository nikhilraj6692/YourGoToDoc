package com.mediconnect.repository;

import com.mediconnect.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorIdAndStatus(String doctorId, String status);
    List<Appointment> findByPatientIdAndStatus(String patientId, String status);
    List<Appointment> findByDoctorIdAndStartTimeBetween(String doctorId, Long startTime, Long endTime);
    List<Appointment> findByPatientIdAndStartTimeBetween(String patientId, Long startTime, Long endTime);
    List<Appointment> findByStartTimeBetween(Long startTime, Long endTime);
} 