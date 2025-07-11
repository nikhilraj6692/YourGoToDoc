package com.mediconnect.interceptor;

import com.mediconnect.enums.UserRole;
import com.mediconnect.security.JwtTokenProvider;
import com.mediconnect.service.ChatSecurityService;
import com.mediconnect.service.UserService;
import com.mediconnect.util.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final ChatSecurityService chatSecurityService;
    
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, 
                                  ServerHttpResponse response, 
                                  WebSocketHandler wsHandler, 
                                  Map<String, Object> attributes) {
        try {
            if (request instanceof ServletServerHttpRequest) {
                ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
                
                // Extract appointment ID from query parameters
                String appointmentId = servletRequest.getServletRequest().getParameter("appointmentId");
                
                if (appointmentId == null) {
                    log.warn("No appointment ID found in WebSocket query parameters");
                    return false;
                }
                
                // Extract JWT token from query parameters
                String token = servletRequest.getServletRequest().getParameter("token");
                
                if (token == null) {
                    log.warn("No JWT token found in WebSocket request");
                    return false;
                }
                
                // Validate JWT token
                if (!tokenProvider.validateToken(token)) {
                    log.warn("Invalid JWT token in WebSocket request");
                    return false;
                }
                
                // Extract user information from token
                String userEmail = tokenProvider.getUsernameFromToken(token);
                var user = userService.findByEmail(userEmail);
                
                if (user == null) {
                    log.warn("User not found for email: {}", userEmail);
                    return false;
                }
                
                // Validate user has access to this appointment
                if (!chatSecurityService.validateChatAccess(appointmentId, user.getId(), user.getRole())) {
                    log.warn("User {} not authorized for appointment {}", user.getId(), appointmentId);
                    return false;
                }
                
                // Store user information in attributes for WebSocket handler
                attributes.put("userId", user.getId());
                attributes.put("userEmail", user.getEmail());
                attributes.put("userRole", user.getRole());
                attributes.put("appointmentId", appointmentId);
                
                log.info("WebSocket handshake successful for user: {}, appointment: {}", user.getId(), appointmentId);
                return true;
            }
            
            log.warn("Invalid request type for WebSocket handshake");
            return false;
            
        } catch (Exception e) {
            log.error("Error during WebSocket handshake", e);
            return false;
        }
    }
    
    @Override
    public void afterHandshake(ServerHttpRequest request, 
                              ServerHttpResponse response, 
                              WebSocketHandler wsHandler, 
                              Exception exception) {
        // Handshake completed - no additional processing needed
        if (exception != null) {
            log.error("WebSocket handshake failed", exception);
        }
    }

} 