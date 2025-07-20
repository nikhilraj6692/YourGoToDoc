package com.mediconnect.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.io.IOException;
import com.mediconnect.util.UserContext;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, @Lazy UserDetailsService userDetailsService, ObjectMapper objectMapper) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip JWT processing for public endpoints
        if (isPublicEndpoint(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);

            // If no token is provided, return 401
            if (!StringUtils.hasText(jwt)) {
                sendUnauthorizedResponse(response, "No authentication token provided");
                return;
            }

            // Validate token and handle specific JWT exceptions
            try {
                tokenProvider.validateTokenAndThrow(jwt);
            } catch (ExpiredJwtException e) {
                logger.error("JWT token is expired", e);
                sendUnauthorizedResponse(response, "Token has expired");
                return;
            } catch (UnsupportedJwtException e) {
                logger.error("JWT token is unsupported", e);
                sendUnauthorizedResponse(response, "Unsupported token format");
                return;
            } catch (MalformedJwtException e) {
                logger.error("JWT token is malformed", e);
                sendUnauthorizedResponse(response, "Malformed token");
                return;
            } catch (SignatureException e) {
                logger.error("JWT signature validation failed", e);
                sendUnauthorizedResponse(response, "Invalid token signature");
                return;
            } catch (IllegalArgumentException e) {
                logger.error("JWT token is empty or null", e);
                sendUnauthorizedResponse(response, "Token is empty or null");
                return;
            } catch (JwtException e) {
                logger.error("JWT validation failed", e);
                sendUnauthorizedResponse(response, "Invalid authentication token");
                return;
            }

            String username = tokenProvider.getUsernameFromToken(jwt);
            String role = tokenProvider.getRoleFromToken(jwt);

            // Validate that we have both username and role
            if (username == null || role == null || role.isEmpty()) {
                sendUnauthorizedResponse(response, "Invalid token claims");
                return;
            }

            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority(role));

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // Validate user details
            if (userDetails == null) {
                sendUnauthorizedResponse(response, "User not found");
                return;
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Set user context
            UserContext.setCurrentUser(username, role);

        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
            sendUnauthorizedResponse(response, "Authentication failed");
            return;
        }

        filterChain.doFilter(request, response);
    }



    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", message);
        errorResponse.put("status", 401);
        errorResponse.put("timestamp", System.currentTimeMillis());
        
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private boolean isPublicEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Public endpoints that don't require authentication
        return path.startsWith("/api/auth") ||
               path.equals("/api/health") ||
               path.startsWith("/swagger-ui") ||
               path.equals("/swagger-ui.html") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/api-docs") ||
               path.startsWith("/ws") ||
               path.startsWith("/api/doctors/search") ||
                path.startsWith("/api/documents") ||
                path.startsWith("/actuator") ||
               method.equals("OPTIONS");
    }
} 