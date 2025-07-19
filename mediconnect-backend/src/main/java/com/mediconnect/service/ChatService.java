package com.mediconnect.service;

import com.mediconnect.dto.chat.ChatMessageRequest;
import com.mediconnect.dto.chat.ChatMessageResponse;
import com.mediconnect.enums.UserRole;
import com.mediconnect.model.Appointment;
import com.mediconnect.model.ChatMessage;
import com.mediconnect.model.ChatRoom;
import com.mediconnect.repository.ChatMessageRepository;
import com.mediconnect.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatSecurityService chatSecurityService;
    
    /**
     * Sends a message and creates/updates chat room
     */
    public ChatMessageResponse sendMessage(ChatMessageRequest request, String senderId, UserRole senderRole) {
        try {
            // Validate access
            if (!chatSecurityService.validateChatAccess(request.getAppointmentId(), senderId, senderRole)) {
                throw new RuntimeException("Access denied for chat");
            }
            
            // Get or create chat room
            ChatRoom chatRoom = getOrCreateChatRoom(request.getAppointmentId(), senderId, senderRole);
            
            // Create and save message
            ChatMessage message = ChatMessage.builder()
                    .appointmentId(request.getAppointmentId())
                    .senderId(senderId)
                    .senderType(senderRole.name())
                    .content(request.getContent())
                    .type(request.getType())
                    .fileUrl(request.getFileUrl())
                    .timestamp(LocalDateTime.now())
                    .isSent(true) // Message is sent when created
                    .isRead(false) // Message is not read yet
                    .fileMetadata(request.getFileMetadata() != null ? 
                        ChatMessage.FileMetadata.builder()
                            .fileName(request.getFileMetadata().getFileName())
                            .mimeType(request.getFileMetadata().getMimeType())
                            .fileSize(request.getFileMetadata().getFileSize())
                            .fileExtension(request.getFileMetadata().getFileExtension())
                            .build() : null)
                    .build();
            
            ChatMessage savedMessage = chatMessageRepository.save(message);
            
            // Update chat room
            chatRoom.incrementMessageCount();
            chatRoomRepository.save(chatRoom);
            
            log.info("Message sent successfully: appointmentId={}, senderId={}, messageId={}", 
                    request.getAppointmentId(), senderId, savedMessage.getId());
            
            return ChatMessageResponse.fromChatMessage(savedMessage);
            
        } catch (Exception e) {
            log.error("Error sending message: appointmentId={}, senderId={}", 
                    request.getAppointmentId(), senderId, e);
            throw new RuntimeException("Failed to send message", e);
        }
    }
    
    /**
     * Gets chat history for an appointment
     */
    public List<ChatMessageResponse> getChatHistory(String appointmentId, String userId, UserRole userRole) {
        try {
            // Validate access
            if (!chatSecurityService.validateChatAccess(appointmentId, userId, userRole)) {
                throw new RuntimeException("Access denied for chat history");
            }
            
            List<ChatMessage> messages = chatMessageRepository.findByAppointmentIdOrderByTimestampAsc(appointmentId);
            
            return messages.stream()
                    .map(ChatMessageResponse::fromChatMessage)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error getting chat history: appointmentId={}, userId={}", appointmentId, userId, e);
            throw new RuntimeException("Failed to get chat history", e);
        }
    }
    
    /**
     * Gets unread message count for a user
     */
    public long getUnreadMessageCount(String appointmentId, String userId) {
        try {
            return chatMessageRepository.countUnreadMessagesByAppointmentIdAndSenderId(appointmentId, userId);
        } catch (Exception e) {
            log.error("Error getting unread message count: appointmentId={}, userId={}", appointmentId, userId, e);
            return 0;
        }
    }
    
    /**
     * Marks messages as read by the current user (messages from other users)
     */
    public void markMessagesAsRead(String appointmentId, String userId) {
        try {
            // Find unread messages from OTHER users (not from the current user)
            List<ChatMessage> unreadMessages = chatMessageRepository
                    .findUnreadMessagesByAppointmentIdAndOtherSenderId(appointmentId, userId);
            
            for (ChatMessage message : unreadMessages) {
                message.setRead(true);
                message.getReadBy().add(userId);
            }
            
            chatMessageRepository.saveAll(unreadMessages);
            log.info("Marked {} messages as read for appointmentId={}, userId={}", 
                    unreadMessages.size(), appointmentId, userId);
                    
        } catch (Exception e) {
            log.error("Error marking messages as read: appointmentId={}, userId={}", appointmentId, userId, e);
        }
    }
    
    /**
     * Marks messages as read and returns the updated messages for broadcasting
     */
    public List<ChatMessageResponse> markMessagesAsReadAndGetUpdates(String appointmentId, String userId) {
        try {
            // Find unread messages from OTHER users (not from the current user)
            List<ChatMessage> unreadMessages = chatMessageRepository
                    .findUnreadMessagesByAppointmentIdAndOtherSenderId(appointmentId, userId);
            
            for (ChatMessage message : unreadMessages) {
                message.setRead(true);
                message.getReadBy().add(userId);
            }
            
            chatMessageRepository.saveAll(unreadMessages);
            log.info("Marked {} messages as read for appointmentId={}, userId={}", 
                    unreadMessages.size(), appointmentId, userId);
            
            // Return the updated messages for broadcasting
            return unreadMessages.stream()
                    .map(ChatMessageResponse::fromChatMessage)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error marking messages as read: appointmentId={}, userId={}", appointmentId, userId, e);
            return List.of();
        }
    }
    
    /**
     * Marks a specific message as sent by the sender
     */
    public void markMessageAsSent(String messageId, String senderId) {
        try {
            ChatMessage message = chatMessageRepository.findById(messageId).orElse(null);
            if (message != null && message.getSenderId().equals(senderId)) {
                // Mark the message as sent
                message.setSent(true);
                chatMessageRepository.save(message);
                log.info("Message marked as sent: messageId={}, senderId={}", messageId, senderId);
            } else {
                log.warn("Cannot mark message as sent: messageId={}, senderId={}, message not found or unauthorized", 
                        messageId, senderId);
            }
        } catch (Exception e) {
            log.error("Error marking message as sent: messageId={}, senderId={}", messageId, senderId, e);
        }
    }
    
    /**
     * Gets or creates a chat room for an appointment
     */
    private ChatRoom getOrCreateChatRoom(String appointmentId, String userId, UserRole userRole) {
        Optional<ChatRoom> existingRoom = chatRoomRepository.findByAppointmentId(appointmentId);
        
        if (existingRoom.isPresent()) {
            return existingRoom.get();
        }
        
        // Create new chat room
        Appointment appointment = chatSecurityService.getAppointmentForValidation(appointmentId);
        if (appointment == null) {
            throw new RuntimeException("Appointment not found");
        }
        
        ChatRoom newRoom = ChatRoom.builder()
                .appointmentId(appointmentId)
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .createdAt(LocalDateTime.now())
                .lastActivity(LocalDateTime.now())
                .isActive(true)
                .messageCount(0)
                .build();
        
        ChatRoom savedRoom = chatRoomRepository.save(newRoom);
        log.info("Created new chat room for appointment: {}", appointmentId);
        
        return savedRoom;
    }
    
    /**
     * Gets chat room by appointment ID
     */
    public Optional<ChatRoom> getChatRoom(String appointmentId) {
        return chatRoomRepository.findByAppointmentId(appointmentId);
    }
    
    /**
     * Gets active chat rooms for a user
     */
    public List<ChatRoom> getActiveChatRooms(String userId, UserRole userRole) {
        if (userRole == UserRole.PATIENT) {
            return chatRoomRepository.findActiveRoomsByPatientId(userId);
        } else if (userRole == UserRole.DOCTOR) {
            return chatRoomRepository.findActiveRoomsByDoctorId(userId);
        }
        return List.of();
    }
} 