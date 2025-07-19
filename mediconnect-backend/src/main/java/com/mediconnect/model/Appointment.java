package com.mediconnect.model;

import com.mediconnect.enums.AppointmentStatus;
import com.mediconnect.enums.AppointmentType;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "appointments")
public class Appointment {
    @Id
    private String id;

    private String doctorId;
    private String patientId;
    private String calendarId;
    private String slotId;
    private LocalDateTime slotStartTime; // Store slot start time directly
    private LocalDateTime slotEndTime;   // Store slot end time directly
    private AppointmentStatus status; // SCHEDULED, CONFIRMED, CANCELLED, COMPLETED
    private AppointmentType type;
    private String reason;
    
    // Timestamps
    private Long createdAt;
    private Long updatedAt;
    
    // Constructor
    public Appointment() {
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = this.createdAt;
        this.status = AppointmentStatus.SCHEDULED;
    }
} 