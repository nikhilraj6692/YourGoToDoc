package com.mediconnect.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(servers())
                .components(components())
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"));
    }

    private Info apiInfo() {
        return new Info()
                .title("MediConnect API")
                .description("""
                        # MediConnect Healthcare Platform API
                        
                        A comprehensive healthcare platform API that connects doctors and patients through secure appointments, 
                        real-time communication, and medical record management.
                        
                        ## Features
                        
                        ### For Patients
                        - **Appointment Booking**: Easy calendar-based booking with real-time slot availability
                        - **Doctor Search**: Advanced search with location, specialty, and rating filters
                        - **Chat System**: Real-time communication with doctors
                        - **Appointment History**: Track past and upcoming appointments
                        
                        ### For Doctors
                        - **Appointment Management**: View and manage patient appointments
                        - **Schedule Management**: Calendar-based availability management
                        - **Patient Information**: Access to patient details and medical history
                        - **Chat System**: Real-time communication with patients
                        
                        ## Authentication
                        
                        This API uses JWT (JSON Web Token) authentication. Include the JWT token in the Authorization header:
                        ```
                        Authorization: Bearer <your-jwt-token>
                        ```
                        
                        ## Rate Limiting
                        
                        - **Public endpoints**: 100 requests per minute
                        - **Authenticated endpoints**: 1000 requests per minute
                        
                        ## Error Handling
                        
                        The API returns structured error responses with appropriate HTTP status codes:
                        - `400` - Bad Request (validation errors)
                        - `401` - Unauthorized (authentication required)
                        - `403` - Forbidden (insufficient permissions)
                        - `404` - Not Found (resource not found)
                        - `500` - Internal Server Error
                        
                        ## WebSocket Support
                        
                        Real-time features like chat and notifications are available via WebSocket connections.
                        """)
                .version("1.0.0")
                .contact(contact())
                .license(license());
    }

    private Contact contact() {
        return new Contact()
                .name("MediConnect Team")
                .email("support@mediconnect.com")
                .url("https://mediconnect.com");
    }

    private License license() {
        return new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");
    }

    private List<Server> servers() {
        return List.of(
                new Server()
                        .url("http://localhost:" + serverPort + contextPath)
                        .description("Local Development Server"),
                new Server()
                        .url("https://mediconnect-backend.railway.app" + contextPath)
                        .description("Production Server")
        );
    }

    private Components components() {
        return new Components()
                .addSecuritySchemes("Bearer Authentication", createAPIKeyScheme());
    }

    private SecurityScheme createAPIKeyScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer")
                .description("Enter your JWT token in the format: Bearer <token>");
    }
} 