package com.mediconnect.interceptor;

import com.mediconnect.security.JwtTokenProvider;
import com.mediconnect.service.ChatSecurityService;
import com.mediconnect.service.UserService;
import com.mediconnect.model.User;
import com.mediconnect.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatHandshakeInterceptorTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserService userService;

    @Mock
    private ChatSecurityService chatSecurityService;

    @Mock
    private ServerHttpRequest serverHttpRequest;

    @Mock
    private ServerHttpResponse serverHttpResponse;

    @Mock
    private WebSocketHandler webSocketHandler;

    private ChatHandshakeInterceptor interceptor;
    private MockHttpServletRequest mockRequest;

    @BeforeEach
    void setUp() {
        interceptor = new ChatHandshakeInterceptor(tokenProvider, userService, chatSecurityService);
        mockRequest = new MockHttpServletRequest();
    }

    @Test
    void testValidWebSocketHandshake() {
        // Given
        String appointmentId = "test-appointment-id";
        String token = "valid-jwt-token";
        String userEmail = "test@example.com";
        String userId = "test-user-id";

        mockRequest.setParameter("appointmentId", appointmentId);
        mockRequest.setParameter("token", token);

        User user = new User();
        user.setId(userId);
        user.setEmail(userEmail);
        user.setRole(UserRole.PATIENT);

        when(tokenProvider.validateTokenAndThrow(token)).thenReturn(null);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(userEmail);
        when(userService.findByEmail(userEmail)).thenReturn(user);
        when(chatSecurityService.validateChatAccess(appointmentId, userId, UserRole.PATIENT)).thenReturn(true);

        // When
        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
            new ServletServerHttpRequest(mockRequest),
            serverHttpResponse,
            webSocketHandler,
            attributes
        );

        // Then
        assertTrue(result);
        assertEquals(userId, attributes.get("userId"));
        assertEquals(userEmail, attributes.get("userEmail"));
        assertEquals(UserRole.PATIENT, attributes.get("userRole"));
        assertEquals(appointmentId, attributes.get("appointmentId"));
    }

    @Test
    void testMissingAppointmentId() {
        // Given
        mockRequest.setParameter("token", "valid-jwt-token");

        // When
        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
            new ServletServerHttpRequest(mockRequest),
            serverHttpResponse,
            webSocketHandler,
            attributes
        );

        // Then
        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }

    @Test
    void testMissingToken() {
        // Given
        mockRequest.setParameter("appointmentId", "test-appointment-id");

        // When
        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
            new ServletServerHttpRequest(mockRequest),
            serverHttpResponse,
            webSocketHandler,
            attributes
        );

        // Then
        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }

    @Test
    void testInvalidToken() {
        // Given
        String appointmentId = "test-appointment-id";
        String token = "invalid-jwt-token";

        mockRequest.setParameter("appointmentId", appointmentId);
        mockRequest.setParameter("token", token);

        when(tokenProvider.validateTokenAndThrow(token))
            .thenThrow(new IllegalArgumentException("Invalid token"));

        // When
        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
            new ServletServerHttpRequest(mockRequest),
            serverHttpResponse,
            webSocketHandler,
            attributes
        );

        // Then
        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }

    @Test
    void testUserNotFound() {
        // Given
        String appointmentId = "test-appointment-id";
        String token = "valid-jwt-token";
        String userEmail = "nonexistent@example.com";

        mockRequest.setParameter("appointmentId", appointmentId);
        mockRequest.setParameter("token", token);

        when(tokenProvider.validateTokenAndThrow(token)).thenReturn(null);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(userEmail);
        when(userService.findByEmail(userEmail)).thenReturn(null);

        // When
        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
            new ServletServerHttpRequest(mockRequest),
            serverHttpResponse,
            webSocketHandler,
            attributes
        );

        // Then
        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }

    @Test
    void testUnauthorizedChatAccess() {
        // Given
        String appointmentId = "test-appointment-id";
        String token = "valid-jwt-token";
        String userEmail = "test@example.com";
        String userId = "test-user-id";

        mockRequest.setParameter("appointmentId", appointmentId);
        mockRequest.setParameter("token", token);

        User user = new User();
        user.setId(userId);
        user.setEmail(userEmail);
        user.setRole(UserRole.PATIENT);

        when(tokenProvider.validateTokenAndThrow(token)).thenReturn(null);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(userEmail);
        when(userService.findByEmail(userEmail)).thenReturn(user);
        when(chatSecurityService.validateChatAccess(appointmentId, userId, UserRole.PATIENT)).thenReturn(false);

        // When
        Map<String, Object> attributes = new HashMap<>();
        boolean result = interceptor.beforeHandshake(
            new ServletServerHttpRequest(mockRequest),
            serverHttpResponse,
            webSocketHandler,
            attributes
        );

        // Then
        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }
} 