package com.mediconnect.service;

import com.mediconnect.enums.AppointmentType;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalField;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    public void sendVerificationStatusEmail(String to, String doctorName, String status, String rejectionReason) throws MessagingException {
        /*Context context = new Context();
        context.setVariable("name", doctorName);
        context.setVariable("status", status);
        context.setVariable("rejectionReason", rejectionReason);

        String emailContent = templateEngine.process("verification-status", context);
        sendHtmlEmail(to, "Doctor Profile Verification Update", emailContent);*/
    }

    public void sendAppointmentStatusEmail(String to, String name, String status, LocalDateTime appointmentDate,
                                           LocalDateTime startTime, LocalDateTime endTime, AppointmentType type,
                                           String cancellationReason) throws MessagingException {
        /*Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("status", status);
        context.setVariable("appointmentDate", appointmentDate);
        context.setVariable("startTime", startTime.toEpochSecond(ZoneOffset.UTC));
        context.setVariable("endTime", endTime.toEpochSecond(ZoneOffset.UTC));
        context.setVariable("type", type);
        context.setVariable("meetingLink", meetingLink);
        context.setVariable("cancellationReason", cancellationReason);

        String emailContent = templateEngine.process("appointment-status", context);
        sendHtmlEmail(to, "Appointment Status Update", emailContent);*/
    }

    public void sendAppointmentReminderEmail(String to, String name, LocalDateTime startTime, LocalDateTime endTime,
            AppointmentType type, String location, String meetingLink) throws MessagingException {
        /*Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("appointmentDate", startTime);
        context.setVariable("startTime", startTime.toEpochSecond(ZoneOffset.UTC));
        context.setVariable("endTime", endTime.toEpochSecond(ZoneOffset.UTC));
        context.setVariable("type", type);
        context.setVariable("location", location);
        context.setVariable("meetingLink", meetingLink);

        String emailContent = templateEngine.process("appointment-reminder", context);
        sendHtmlEmail(to, "Appointment Reminder", emailContent);*/
    }

    /**
     * Sends a simple notification email to the user.
     */
    public void sendNotificationEmail(String to, String fullName, String title, String message) throws MessagingException {
        // Stub: Implement actual email sending logic with template if needed
        // For now, just send a basic email
        /*Context context = new Context();
        context.setVariable("name", fullName);
        context.setVariable("title", title);
        context.setVariable("message", message);
        String emailContent = "<h1>" + title + "</h1><p>" + message + "</p>";
        sendHtmlEmail(to, title, emailContent);*/
    }

    /**
     * Sends a digest email with a list of notifications.
     */
    public void sendNotificationDigestEmail(String to, String fullName, java.util.List<com.mediconnect.model.Notification> notifications) throws MessagingException {
        // Stub: Implement actual digest email logic with template if needed
        /*StringBuilder sb = new StringBuilder();
        sb.append("<h1>Notification Digest</h1>");
        sb.append("<p>Hello, ").append(fullName).append(". Here are your recent notifications:</p>");
        sb.append("<ul>");
        for (com.mediconnect.model.Notification n : notifications) {
            sb.append("<li><b>").append(n.getTitle()).append(":</b> ").append(n.getMessage()).append("</li>");
        }
        sb.append("</ul>");
        sendHtmlEmail(to, "Your Notification Digest", sb.toString());*/
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        //mailSender.send(message);
    }
} 