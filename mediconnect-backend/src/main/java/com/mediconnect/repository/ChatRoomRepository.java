package com.mediconnect.repository;

import com.mediconnect.model.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends MongoRepository<ChatRoom, String> {
    
    Optional<ChatRoom> findByAppointmentId(String appointmentId);
    
    @Query("{'patientId': ?0}")
    List<ChatRoom> findByPatientId(String patientId);
    
    @Query("{'doctorId': ?0}")
    List<ChatRoom> findByDoctorId(String doctorId);
    
    @Query("{'patientId': ?0, 'isActive': true}")
    List<ChatRoom> findActiveRoomsByPatientId(String patientId);
    
    @Query("{'doctorId': ?0, 'isActive': true}")
    List<ChatRoom> findActiveRoomsByDoctorId(String doctorId);
    
    @Query("{'lastActivity': {$lt: ?0}}")
    List<ChatRoom> findInactiveRooms(LocalDateTime cutoffTime);
    
    @Query(value = "{'appointmentId': ?0}", exists = true)
    boolean existsByAppointmentId(String appointmentId);
    
    @Query(value = "{'patientId': ?0, 'isActive': true}", count = true)
    long countActiveRoomsByPatientId(String patientId);
    
    @Query(value = "{'doctorId': ?0, 'isActive': true}", count = true)
    long countActiveRoomsByDoctorId(String doctorId);
} 