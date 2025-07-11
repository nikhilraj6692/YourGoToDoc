package com.mediconnect.repository;

import com.mediconnect.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
    @Query("{'appointmentId': ?0}")
    List<ChatMessage> findByAppointmentIdOrderByTimestampAsc(String appointmentId);
    
    @Query("{'appointmentId': ?0, 'timestamp': {$gte: ?1}}")
    List<ChatMessage> findByAppointmentIdAndTimestampAfterOrderByTimestampAsc(String appointmentId, LocalDateTime timestamp);
    
    @Query("{'appointmentId': ?0, 'senderId': ?1, 'isRead': false}")
    List<ChatMessage> findUnreadMessagesByAppointmentIdAndSenderId(String appointmentId, String senderId);
    
    @Query("{'appointmentId': ?0, 'senderId': {$ne: ?1}, 'isRead': false}")
    List<ChatMessage> findUnreadMessagesByAppointmentIdAndOtherSenderId(String appointmentId, String userId);
    
    @Query("{'appointmentId': ?0, 'isRead': false}")
    List<ChatMessage> findUnreadMessagesByAppointmentId(String appointmentId);
    
    @Query(value = "{'appointmentId': ?0}", count = true)
    long countByAppointmentId(String appointmentId);
    
    @Query(value = "{'appointmentId': ?0, 'isRead': false}", count = true)
    long countUnreadMessagesByAppointmentId(String appointmentId);
    
    @Query(value = "{'appointmentId': ?0, 'senderId': ?1, 'isRead': false}", count = true)
    long countUnreadMessagesByAppointmentIdAndSenderId(String appointmentId, String senderId);
} 