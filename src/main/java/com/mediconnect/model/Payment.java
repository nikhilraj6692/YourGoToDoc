package com.mediconnect.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Payment {
    private String id;
    private String appointmentId;
    private double amount;
    private double commission;
    private double netAmount;
    private String status; // PENDING, COMPLETED, FAILED, REFUNDED
    private String paymentMethod;
    private String transactionId;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 