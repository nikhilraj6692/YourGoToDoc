package com.mediconnect.enums;

public enum ErrorCode {
    // Authentication errors
    INVALID_CREDENTIALS("AUTH_001", "Invalid credentials"),
    USER_NOT_FOUND("AUTH_002", "User not found"),
    EMAIL_ALREADY_EXISTS("AUTH_003", "Email is already taken"),
    
    // Role-based errors
    PATIENT_ONLY_OPERATION("ROLE_001", "Please login with a patient account to book appointments"),
    DOCTOR_ONLY_OPERATION("ROLE_002", "Only doctors can perform this operation"),
    
    // Appointment errors
    SLOT_NOT_AVAILABLE("APPT_001", "Selected slot is not available"),
    SCHEDULING_CONFLICT("APPT_002", "An existing schedule exists on the same day. Please cancel existing one to proceed"),
    
    // Generic errors
    GENERIC_ERROR("GEN_001", "An error occurred. Please try after some time"),
    VALIDATION_ERROR("GEN_002", "Validation failed"),
    
    // Token errors
    INVALID_TOKEN("TOKEN_001", "Invalid token"),
    TOKEN_EXPIRED("TOKEN_002", "Token expired"),
    REFRESH_TOKEN_INVALID("TOKEN_003", "Invalid refresh token");
    
    private final String code;
    private final String message;
    
    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getMessage() {
        return message;
    }
} 