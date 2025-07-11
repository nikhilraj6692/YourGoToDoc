package com.mediconnect.controller;

import com.mediconnect.dto.chat.ChatMessageRequest;
import com.mediconnect.dto.chat.ChatMessageResponse;
import com.mediconnect.enums.UserRole;
import com.mediconnect.handler.ChatWebSocketHandler;
import com.mediconnect.model.User;
import com.mediconnect.service.ChatService;
import com.mediconnect.service.UserService;
import com.mediconnect.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat Management", description = "APIs for chat functionality")
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;
    private final ChatWebSocketHandler chatWebSocketHandler;

    @GetMapping("/history/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Get chat history", description = "Retrieves chat history for a specific appointment")
    public ResponseEntity<List<ChatMessageResponse>> getChatHistory(@PathVariable String appointmentId) {
        try {
            String userEmail = UserContext.getCurrentUserEmail();
            User user = userService.findByEmail(userEmail);
            String userId = user.getId();
            UserRole userRole = user.getRole();

            List<ChatMessageResponse> history = chatService.getChatHistory(appointmentId, userId, userRole);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting chat history for appointment: {}", appointmentId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Send message", description = "Sends a message for a specific appointment")
    public ResponseEntity<ChatMessageResponse> sendMessage(@RequestBody ChatMessageRequest request) {
        try {
            String userEmail = UserContext.getCurrentUserEmail();
            User user = userService.findByEmail(userEmail);
            String userId = user.getId();
            UserRole userRole = user.getRole();

            ChatMessageResponse response = chatService.sendMessage(request, userId, userRole);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending message for appointment: {}", request.getAppointmentId(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/mark-read/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Mark messages as read", description = "Marks all messages as read for a specific appointment")
    public ResponseEntity<Void> markMessagesAsRead(@PathVariable String appointmentId) {
        try {
            String userEmail = UserContext.getCurrentUserEmail();
            User user = userService.findByEmail(userEmail);
            String userId = user.getId();

            // Mark messages as read and get the updated messages
            List<ChatMessageResponse> updatedMessages = chatService.markMessagesAsReadAndGetUpdates(appointmentId, userId);
            
            // Extract message IDs for broadcasting
            List<String> messageIds = updatedMessages.stream()
                    .map(ChatMessageResponse::getId)
                    .toList();
            
            // Broadcast read status update to all connected users
            if (!messageIds.isEmpty()) {
                chatWebSocketHandler.broadcastReadStatusUpdate(appointmentId, userId, messageIds);
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking messages as read for appointment: {}", appointmentId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/unread-count/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Get unread message count", description = "Gets the count of unread messages for a specific appointment")
    public ResponseEntity<Long> getUnreadMessageCount(@PathVariable String appointmentId) {
        try {
            String userEmail = UserContext.getCurrentUserEmail();
            User user = userService.findByEmail(userEmail);
            String userId = user.getId();

            long count = chatService.getUnreadMessageCount(appointmentId, userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error getting unread message count for appointment: {}", appointmentId, e);
            return ResponseEntity.badRequest().build();
        }
    }
} 