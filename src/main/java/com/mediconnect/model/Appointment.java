package com.mediconnect.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "appointments")
public class Appointment {
    @Id
    private String id;

    private String doctorId;
    private String patientId;
    private Long startTime;
    private Long endTime;
    private String status; // SCHEDULED, CONFIRMED, CANCELLED, COMPLETED
    private String type; // IN_PERSON, VIDEO, PHONE
    private String reason;
    private String notes;
    private String meetingLink; // For video consultations
    private String location; // For in-person appointments
    
    // Timestamps
    private Long createdAt;
    private Long updatedAt;
    private Long cancelledAt;
    private String cancellationReason;
    
    // Constructor
    public Appointment() {
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = this.createdAt;
        this.status = "SCHEDULED";
    }
} 