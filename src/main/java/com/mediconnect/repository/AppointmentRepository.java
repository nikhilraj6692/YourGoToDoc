package com.mediconnect.repository;

import com.mediconnect.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorIdAndStatus(String doctorId, String status);
    List<Appointment> findByPatientIdAndStatus(String patientId, String status);
    List<Appointment> findByPatientIdAndCalendarId(String patientId, String calendarId);
    List<Appointment> findByPatientIdAndCalendarIdAndStatusIsNot(String patientId, String calendarId, String status);

    @Query("{ 'patientId': ?0, 'calendarId': ?1, 'status': { $nin: ['CANCELLED', 'COMPLETED'] } }")
    List<Appointment> findByPatientIdAndCalendarIdActive(String patientId, String calendarId);
    
    // New methods for date-based filtering
    @Query("{ 'doctorId': ?0, 'calendarId': { $in: ?1 } }")
    List<Appointment> findByDoctorIdAndCalendarIds(String doctorId, List<String> calendarIds);
    
    @Query("{ 'doctorId': ?0, 'status': ?1, 'calendarId': { $in: ?2 } }")
    List<Appointment> findByDoctorIdAndStatusAndCalendarIds(String doctorId, String status, List<String> calendarIds);
    
    @Query("{ 'doctorId': ?0, 'status': { $in: ?1 }, 'calendarId': { $in: ?2 } }")
    List<Appointment> findByDoctorIdAndStatusInAndCalendarIds(String doctorId, List<String> statuses, List<String> calendarIds);

    List<Appointment> findAllBySlotIdIn(List<String> slotIds);
}