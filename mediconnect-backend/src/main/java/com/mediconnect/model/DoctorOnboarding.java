package com.mediconnect.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DoctorOnboarding {
    private String id;
    private String userId;
    private BasicDetails basicDetails;
    private Documents documents;
    private String status;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class BasicDetails {
        private String firstName;
        private String lastName;
        private String phone;
        private String address;
        private String specialization;
    }

    @Data
    public static class Documents {
        private String photo;
        private String degree;
        private String license;
    }
} 