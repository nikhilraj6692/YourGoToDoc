package com.mediconnect.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.dto.chat.ChatMessageRequest;
import com.mediconnect.dto.chat.ChatMessageResponse;
import com.mediconnect.dto.chat.ReadStatusUpdate;
import com.mediconnect.dto.chat.UserPresenceUpdate;
import com.mediconnect.enums.UserRole;
import com.mediconnect.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketHandler extends TextWebSocketHandler {
    
    private final ChatService chatService;
    private final ObjectMapper objectMapper;
    
    // Connection pool: Map<appointmentId, Map<sessionId, WebSocketSession>>
    private final Map<String, Map<String, WebSocketSession>> chatRooms = new ConcurrentHashMap<>();
    
    // User sessions: Map<userId, Set<appointmentId>>
    private final Map<String, Map<String, WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    
    // Cleanup scheduler for inactive connections
    private final ScheduledExecutorService cleanupScheduler = Executors.newScheduledThreadPool(1);
    
    // Heartbeat scheduler for presence updates
    private final ScheduledExecutorService heartbeatScheduler = Executors.newScheduledThreadPool(1);
    
    // Track active heartbeats: Map<appointmentId:userId, ScheduledFuture>
    private final Map<String, java.util.concurrent.ScheduledFuture<?>> activeHeartbeats = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        try {
            // Extract user information from session attributes
            String userId = (String) session.getAttributes().get("userId");
            String userEmail = (String) session.getAttributes().get("userEmail");
            UserRole userRole = (UserRole) session.getAttributes().get("userRole");
            String appointmentId = (String) session.getAttributes().get("appointmentId");
            
            if (userId == null || appointmentId == null) {
                log.warn("Missing user information in WebSocket session");
                session.close();
                return;
            }
            
            // Add session to chat room
            chatRooms.computeIfAbsent(appointmentId, k -> new ConcurrentHashMap<>())
                    .put(session.getId(), session);
            
            // Add session to user sessions
            userSessions.computeIfAbsent(userId, k -> new ConcurrentHashMap<>())
                    .put(appointmentId, session);
            
            log.info("WebSocket connection established: userId={}, appointmentId={}, sessionId={}", 
                    userId, appointmentId, session.getId());
            
            // Send connection confirmation
            sendMessage(session, createConnectionMessage("connected", appointmentId));
            
            // Broadcast user presence update to other participants
            log.info("Broadcasting user online status: userId={}, appointmentId={}, userRole={}", userId, appointmentId, userRole.name());
            broadcastUserPresenceUpdate(appointmentId, userId, userRole.name(), true);
            
            // Start heartbeat for this user
            startHeartbeat(appointmentId, userId, userRole.name());
            
        } catch (Exception e) {
            log.error("Error establishing WebSocket connection", e);
        }
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            log.debug("Received WebSocket message: {}", payload);
            
            // Parse message
            ChatMessageRequest chatRequest = objectMapper.readValue(payload, ChatMessageRequest.class);
            
            // Extract user information
            String userId = (String) session.getAttributes().get("userId");
            UserRole userRole = (UserRole) session.getAttributes().get("userRole");
            String appointmentId = (String) session.getAttributes().get("appointmentId");
            
            if (userId == null || userRole == null || appointmentId == null) {
                log.warn("Missing user information in WebSocket session");
                return;
            }
            
            // Send message through chat service
            ChatMessageResponse response = chatService.sendMessage(chatRequest, userId, userRole);
            
            // Broadcast message to all participants in the chat room
            broadcastMessage(appointmentId, response);
            
            // Mark the sender's message as sent (not read)
            chatService.markMessageAsSent(response.getId(), userId);
            
            log.info("Message processed and broadcasted: appointmentId={}, senderId={}, messageId={}", 
                    appointmentId, userId, response.getId());
            
        } catch (Exception e) {
            log.error("Error handling WebSocket message", e);
            try {
                sendMessage(session, createErrorMessage("Failed to process message"));
            } catch (IOException ex) {
                log.error("Error sending error message", ex);
            }
        }
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        try {
            String userId = (String) session.getAttributes().get("userId");
            String appointmentId = (String) session.getAttributes().get("appointmentId");
            String sessionId = session.getId();
            
            // Remove session from chat room
            Map<String, WebSocketSession> roomSessions = chatRooms.get(appointmentId);
            if (roomSessions != null) {
                roomSessions.remove(sessionId);
                if (roomSessions.isEmpty()) {
                    chatRooms.remove(appointmentId);
                }
            }
            
            // Remove session from user sessions
            Map<String, WebSocketSession> userAppointments = userSessions.get(userId);
            if (userAppointments != null) {
                userAppointments.remove(appointmentId);
                if (userAppointments.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
            
            log.info("WebSocket connection closed: userId={}, appointmentId={}, sessionId={}, status={}", 
                    userId, appointmentId, sessionId, status);
            
            // Broadcast user presence update to other participants
            if (userId != null && appointmentId != null) {
                UserRole userRole = (UserRole) session.getAttributes().get("userRole");
                if (userRole != null) {
                    log.info("Broadcasting user offline status: userId={}, appointmentId={}, userRole={}", userId, appointmentId, userRole.name());
                    broadcastUserPresenceUpdate(appointmentId, userId, userRole.name(), false);
                }
                
                // Stop heartbeat for this user
                stopHeartbeat(appointmentId, userId);
            }
            
        } catch (Exception e) {
            log.error("Error handling WebSocket connection close", e);
        }
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error for session: {}", session.getId(), exception);
    }
    
    /**
     * Broadcasts a message to all participants in a chat room
     */
    public void broadcastMessage(String appointmentId, ChatMessageResponse message) {
        Map<String, WebSocketSession> roomSessions = chatRooms.get(appointmentId);
        if (roomSessions == null) {
            log.warn("No active sessions for appointment: {}", appointmentId);
            return;
        }
        
        String messageJson;
        try {
            messageJson = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("Error serializing message", e);
            return;
        }
        
        TextMessage textMessage = new TextMessage(messageJson);
        
        // Send to all sessions in the room
        roomSessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                }
            } catch (IOException e) {
                log.error("Error sending message to session: {}", session.getId(), e);
            }
        });
    }
    
    /**
     * Broadcasts read status updates to all participants in a chat room
     */
    public void broadcastReadStatusUpdate(String appointmentId, String readByUserId, List<String> messageIds) {
        Map<String, WebSocketSession> roomSessions = chatRooms.get(appointmentId);
        if (roomSessions == null) {
            log.warn("No active sessions for appointment: {}", appointmentId);
            return;
        }
        
        ReadStatusUpdate readStatusUpdate = ReadStatusUpdate.create(appointmentId, readByUserId, messageIds);
        
        String messageJson;
        try {
            messageJson = objectMapper.writeValueAsString(readStatusUpdate);
        } catch (Exception e) {
            log.error("Error serializing read status update", e);
            return;
        }
        
        TextMessage textMessage = new TextMessage(messageJson);
        
        // Send to all sessions in the room
        roomSessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(textMessage);
                }
            } catch (IOException e) {
                log.error("Error sending read status update to session: {}", session.getId(), e);
            }
        });
        
        log.info("Broadcasted read status update: appointmentId={}, readByUserId={}, messageIds={}", 
                appointmentId, readByUserId, messageIds);
    }
    
    /**
     * Broadcasts user presence updates to all participants in a chat room
     */
    public void broadcastUserPresenceUpdate(String appointmentId, String userId, String userRole, boolean isOnline) {
        Map<String, WebSocketSession> roomSessions = chatRooms.get(appointmentId);
        if (roomSessions == null) {
            log.warn("No active sessions for appointment: {}", appointmentId);
            return;
        }
        
        UserPresenceUpdate presenceUpdate = UserPresenceUpdate.create(appointmentId, userId, userRole, isOnline);
        
        String messageJson;
        try {
            messageJson = objectMapper.writeValueAsString(presenceUpdate);
        } catch (Exception e) {
            log.error("Error serializing user presence update", e);
            return;
        }
        
        TextMessage textMessage = new TextMessage(messageJson);
        
        // Send to all sessions in the room (except the user who triggered the update)
        roomSessions.values().forEach(session -> {
            try {
                String sessionUserId = (String) session.getAttributes().get("userId");
                if (session.isOpen() && !userId.equals(sessionUserId)) {
                    session.sendMessage(textMessage);
                }
            } catch (IOException e) {
                log.error("Error sending user presence update to session: {}", session.getId(), e);
            }
        });
        
        log.info("Broadcasted user presence update: appointmentId={}, userId={}, userRole={}, isOnline={}", 
                appointmentId, userId, userRole, isOnline);
    }
    
    /**
     * Sends a message to a specific session
     */
    private void sendMessage(WebSocketSession session, Object message) throws IOException {
        String messageJson = objectMapper.writeValueAsString(message);
        session.sendMessage(new TextMessage(messageJson));
    }
    
    /**
     * Creates a connection message
     */
    private Map<String, Object> createConnectionMessage(String type, String appointmentId) {
        return Map.of(
            "type", type,
            "appointmentId", appointmentId,
            "timestamp", System.currentTimeMillis()
        );
    }
    
    /**
     * Creates an error message
     */
    private Map<String, Object> createErrorMessage(String error) {
        return Map.of(
            "type", "error",
            "message", error,
            "timestamp", System.currentTimeMillis()
        );
    }
    
    /**
     * Cleans up inactive connections
     */
    private void cleanupInactiveConnections() {
        try {
            log.debug("Starting cleanup of inactive WebSocket connections");
            
            // Remove closed sessions from chat rooms
            chatRooms.forEach((appointmentId, sessions) -> {
                sessions.entrySet().removeIf(entry -> !entry.getValue().isOpen());
                if (sessions.isEmpty()) {
                    chatRooms.remove(appointmentId);
                    log.debug("Removed empty chat room: {}", appointmentId);
                }
            });
            
            // Remove closed sessions from user sessions
            userSessions.forEach((userId, appointments) -> {
                appointments.entrySet().removeIf(entry -> !entry.getValue().isOpen());
                if (appointments.isEmpty()) {
                    userSessions.remove(userId);
                    log.debug("Removed user sessions: {}", userId);
                }
            });
            
            log.debug("Cleanup completed. Active chat rooms: {}, Active users: {}", 
                    chatRooms.size(), userSessions.size());
            
        } catch (Exception e) {
            log.error("Error during connection cleanup", e);
        }
    }
    
    /**
     * Gets active session count for an appointment
     */
    public int getActiveSessionCount(String appointmentId) {
        Map<String, WebSocketSession> sessions = chatRooms.get(appointmentId);
        return sessions != null ? sessions.size() : 0;
    }
    
    /**
     * Gets active chat rooms count
     */
    public int getActiveChatRoomsCount() {
        return chatRooms.size();
    }
    
    /**
     * Starts heartbeat for a user in a specific appointment
     */
    private void startHeartbeat(String appointmentId, String userId, String userRole) {
        String heartbeatKey = appointmentId + ":" + userId;
        
        // Cancel existing heartbeat if any
        stopHeartbeat(appointmentId, userId);
        
        // Schedule heartbeat every 10 seconds
        java.util.concurrent.ScheduledFuture<?> heartbeat = heartbeatScheduler.scheduleAtFixedRate(() -> {
            try {
                // Check if user is still connected
                Map<String, WebSocketSession> roomSessions = chatRooms.get(appointmentId);
                if (roomSessions != null) {
                    boolean userStillConnected = roomSessions.values().stream()
                            .anyMatch(session -> {
                                String sessionUserId = (String) session.getAttributes().get("userId");
                                return userId.equals(sessionUserId) && session.isOpen();
                            });
                    
                    if (userStillConnected) {
                        log.debug("Broadcasting heartbeat presence: userId={}, appointmentId={}", userId, appointmentId);
                        broadcastUserPresenceUpdate(appointmentId, userId, userRole, true);
                    } else {
                        log.debug("User no longer connected, stopping heartbeat: userId={}, appointmentId={}", userId, appointmentId);
                        stopHeartbeat(appointmentId, userId);
                    }
                } else {
                    log.debug("Chat room no longer exists, stopping heartbeat: appointmentId={}", appointmentId);
                    stopHeartbeat(appointmentId, userId);
                }
            } catch (Exception e) {
                log.error("Error in heartbeat for user: userId={}, appointmentId={}", userId, appointmentId, e);
                stopHeartbeat(appointmentId, userId);
            }
        }, 10, 10, java.util.concurrent.TimeUnit.SECONDS);
        
        // Store the heartbeat future
        activeHeartbeats.put(heartbeatKey, heartbeat);
        
        log.info("Started heartbeat for user: userId={}, appointmentId={}", userId, appointmentId);
    }
    
    /**
     * Stops heartbeat for a user in a specific appointment
     */
    private void stopHeartbeat(String appointmentId, String userId) {
        String heartbeatKey = appointmentId + ":" + userId;
        java.util.concurrent.ScheduledFuture<?> heartbeat = activeHeartbeats.remove(heartbeatKey);
        
        if (heartbeat != null && !heartbeat.isCancelled()) {
            heartbeat.cancel(false);
            log.info("Stopped heartbeat for user: userId={}, appointmentId={}", userId, appointmentId);
        }
    }
    
    /**
     * Stops all active heartbeats
     */
    public void stopAllHeartbeats() {
        log.info("Stopping all active heartbeats. Count: {}", activeHeartbeats.size());
        
        activeHeartbeats.values().forEach(heartbeat -> {
            if (heartbeat != null && !heartbeat.isCancelled()) {
                heartbeat.cancel(false);
            }
        });
        
        activeHeartbeats.clear();
        log.info("All heartbeats stopped");
    }
} 