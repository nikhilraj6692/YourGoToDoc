package com.mediconnect.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserDetailsService userDetailsService;

    private JwtAuthenticationFilter filter;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        filter = new JwtAuthenticationFilter(tokenProvider, userDetailsService, objectMapper);
    }

    @Test
    void testPublicEndpoint_ShouldNotRequireAuthentication() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/login");
        request.setMethod("POST");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(200, response.getStatus());
    }

    @Test
    void testProtectedEndpoint_NoToken_ShouldReturn401() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/appointments");
        request.setMethod("GET");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(401, response.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, response.getContentType());
        assertTrue(response.getContentAsString().contains("No authentication token provided"));
    }

    @Test
    void testProtectedEndpoint_InvalidToken_ShouldReturn401() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/appointments");
        request.setMethod("GET");
        request.addHeader("Authorization", "Bearer invalid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        when(tokenProvider.validateTokenAndThrow("invalid-token"))
                .thenThrow(new IllegalArgumentException("Token is null or empty"));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(401, response.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, response.getContentType());
        assertTrue(response.getContentAsString().contains("Token is empty or null"));
    }

    @Test
    void testProtectedEndpoint_ExpiredToken_ShouldReturn401() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/appointments");
        request.setMethod("GET");
        request.addHeader("Authorization", "Bearer expired-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        when(tokenProvider.validateTokenAndThrow("expired-token"))
                .thenThrow(new io.jsonwebtoken.ExpiredJwtException(null, null, "Token has expired"));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(401, response.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, response.getContentType());
        assertTrue(response.getContentAsString().contains("Token has expired"));
    }

    @Test
    void testProtectedEndpoint_ValidToken_ShouldAuthenticate() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/appointments");
        request.setMethod("GET");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        UserDetails userDetails = User.builder()
                .username("test@example.com")
                .password("password")
                .authorities("ROLE_PATIENT")
                .build();

        when(tokenProvider.validateTokenAndThrow("valid-token")).thenReturn(null);
        when(tokenProvider.getUsernameFromToken("valid-token")).thenReturn("test@example.com");
        when(tokenProvider.getRoleFromToken("valid-token")).thenReturn("ROLE_PATIENT");
        when(userDetailsService.loadUserByUsername("test@example.com")).thenReturn(userDetails);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(200, response.getStatus());
    }

    @Test
    void testCorsPreflight_ShouldNotRequireAuthentication() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/appointments");
        request.setMethod("OPTIONS");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(200, response.getStatus());
    }

    @Test
    void testWebSocketUpgrade_ShouldNotRequireAuthentication() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/ws/chat");
        request.setMethod("GET");
        request.addHeader("Upgrade", "websocket");
        request.addHeader("Connection", "Upgrade");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(200, response.getStatus());
    }

    @Test
    void testWebSocketPath_ShouldNotRequireAuthentication() throws Exception {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/ws/chat?appointmentId=123&token=abc");
        request.setMethod("GET");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertEquals(200, response.getStatus());
    }
} 