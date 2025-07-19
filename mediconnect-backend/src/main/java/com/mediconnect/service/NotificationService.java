package com.mediconnect.service;

import com.mediconnect.dto.websocket.WebSocketNotification;
import com.mediconnect.model.Notification;
import com.mediconnect.repository.NotificationRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public void createNotification(String userId, String title, String message, String type, String relatedId) {
        // Create and save notification
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedId(relatedId);
        notificationRepository.save(notification);

        WebSocketNotification wsNotification = new WebSocketNotification();
        wsNotification.setType(type);
        wsNotification.setTitle(title);
        wsNotification.setMessage(message);
        wsNotification.setRelatedId(relatedId);
        webSocketService.sendNotificationToUser(userId, wsNotification);
    }

    public List<Notification> getUserNotifications(String userId, String type, String status, boolean groupByType) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // Apply filters
        if (type != null) {
            notifications = notifications.stream()
                .filter(n -> n.getType().equals(type))
                .collect(Collectors.toList());
        }
        
        if (status != null) {
            notifications = notifications.stream()
                .filter(n -> n.getStatus().equals(status))
                .collect(Collectors.toList());
        }

        // Group notifications if requested
        if (groupByType) {
            return groupNotificationsByType(notifications);
        }

        return notifications;
    }

    private List<Notification> groupNotificationsByType(List<Notification> notifications) {
        Map<String, List<Notification>> grouped = notifications.stream()
            .collect(Collectors.groupingBy(Notification::getType));
        
        return grouped.entrySet().stream()
            .map(entry -> {
                Notification groupNotification = new Notification();
                groupNotification.setType(entry.getKey());
                groupNotification.setTitle(entry.getKey() + " Notifications");
                groupNotification.setMessage(entry.getValue().size() + " notifications");
                groupNotification.setCreatedAt(entry.getValue().get(0).getCreatedAt());
                return groupNotification;
            })
            .collect(Collectors.toList());
    }

    private boolean isFirstDayOfWeek() {
        return Calendar.getInstance().get(Calendar.DAY_OF_WEEK) == Calendar.MONDAY;
    }

    /*@Scheduled(cron = "0 0 9 * * ?") // Run at 9 AM every day
    public void sendAppointmentReminders() {
        long now = System.currentTimeMillis();
        long tomorrow = now + 24 * 60 * 60 * 1000; // 24 hours from now

        // Get all appointments scheduled for tomorrow
        List<Appointment> tomorrowAppointments = appointmentRepository.findByStartTimeBetween(now, tomorrow);

        for (Appointment appointment : tomorrowAppointments) {
            if ("CONFIRMED".equals(appointment.getStatus())) {
                try {
                    var doctor = userRepository.findById(appointment.getDoctorId()).orElseThrow();
                    var patient = userRepository.findById(appointment.getPatientId()).orElseThrow();

                    // Create reminder notifications
                    createNotification(
                        doctor.getId(),
                        "Appointment Reminder",
                        "You have an appointment tomorrow with " + patient.getFullName(),
                        "REMINDER",
                        appointment.getId()
                    );

                    createNotification(
                        patient.getId(),
                        "Appointment Reminder",
                        "You have an appointment tomorrow with Dr. " + doctor.getFullName(),
                        "REMINDER",
                        appointment.getId()
                    );

                    // Send reminder emails
                    emailService.sendAppointmentReminderEmail(
                        doctor.getEmail(),
                        doctor.getFullName(),
                            null, //appointment.getStartTime(),
                            null, //appointment.getEndTime(),
                        appointment.getType(),
                        appointment.getMeetingLink(),
                            null
                    );

                    emailService.sendAppointmentReminderEmail(
                        patient.getEmail(),
                        patient.getFullName(),
                            null, //appointment.getStartTime(),
                            null, //appointment.getEndTime(),
                        appointment.getType(),
                        appointment.getMeetingLink(),
                            null
                    );
                } catch (MessagingException e) {
                    // Log the error but continue with other appointments
                    e.printStackTrace();
                }
            }
        }
    }*/

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "UNREAD");
    }

    public void markNotificationAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setStatus("READ");
            notification.setReadAt(System.currentTimeMillis());
            notificationRepository.save(notification);
        });
    }

    public void markAllNotificationsAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "UNREAD");
        for (Notification notification : unreadNotifications) {
            notification.setStatus("READ");
            notification.setReadAt(System.currentTimeMillis());
            notificationRepository.save(notification);
        }
    }

    public List<Notification> getUserNotifications(String userId) {
        return getUserNotifications(userId, null, null, false);
    }

} 