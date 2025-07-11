package com.mediconnect.service;

import com.mediconnect.dto.websocket.WebSocketNotification;
import com.mediconnect.model.Appointment;
import com.mediconnect.model.Notification;
import com.mediconnect.model.NotificationPreferences;
import com.mediconnect.repository.NotificationPreferencesRepository;
import com.mediconnect.repository.NotificationRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.repository.AppointmentRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferencesRepository preferencesRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public void createNotification(String userId, String title, String message, String type, String relatedId) {
        NotificationPreferences preferences = preferencesRepository.findByUserId(userId);
        if (preferences == null) {
            preferences = createDefaultPreferences(userId);
        }

        // Check if notifications are allowed during current time
        if (preferences.isQuietHoursEnabled() && isWithinQuietHours(preferences)) {
            return;
        }

        String deliveryMethod = preferences.getDeliveryPreferences().getOrDefault(type, preferences.getDefaultDeliveryMethod());
        
        if (deliveryMethod.equals("NONE")) {
            return;
        }

        // Create and save notification
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedId(relatedId);
        notificationRepository.save(notification);

        // Send real-time notification if configured
        if (deliveryMethod.equals("IN_APP") || deliveryMethod.equals("BOTH")) {
            WebSocketNotification wsNotification = new WebSocketNotification();
            wsNotification.setType(type);
            wsNotification.setTitle(title);
            wsNotification.setMessage(message);
            wsNotification.setRelatedId(relatedId);
            webSocketService.sendNotificationToUser(userId, wsNotification);
        }

        // Send email if configured
        if (deliveryMethod.equals("EMAIL") || deliveryMethod.equals("BOTH")) {
            try {
                var user = userRepository.findById(userId).orElseThrow();
                emailService.sendNotificationEmail(user.getEmail(), user.getFullName(), title, message);
            } catch (MessagingException e) {
                // Log the error but don't fail the request
                e.printStackTrace();
            }
        }
    }

    private boolean isWithinQuietHours(NotificationPreferences preferences) {
        LocalTime now = LocalTime.now();
        LocalTime start = LocalTime.parse(preferences.getQuietHoursStart(), DateTimeFormatter.ofPattern("HH:mm"));
        LocalTime end = LocalTime.parse(preferences.getQuietHoursEnd(), DateTimeFormatter.ofPattern("HH:mm"));
        
        if (start.isBefore(end)) {
            return now.isAfter(start) && now.isBefore(end);
        } else {
            // Handle overnight quiet hours
            return now.isAfter(start) || now.isBefore(end);
        }
    }

    private NotificationPreferences createDefaultPreferences(String userId) {
        NotificationPreferences preferences = new NotificationPreferences();
        preferences.setUserId(userId);
        preferences.setDefaultDeliveryMethod("BOTH");
        preferences.setGroupByType(true);
        preferences.setGroupByDate(true);
        preferences.setQuietHoursEnabled(false);
        preferences.setEmailDigestEnabled(true);
        preferences.setEmailDigestFrequency("DAILY");
        
        Map<String, String> deliveryPrefs = new HashMap<>();
        deliveryPrefs.put("APPOINTMENT", "BOTH");
        deliveryPrefs.put("REMINDER", "BOTH");
        deliveryPrefs.put("SYSTEM", "IN_APP");
        preferences.setDeliveryPreferences(deliveryPrefs);
        
        return preferencesRepository.save(preferences);
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

    @Scheduled(cron = "0 0 9 * * ?") // Run at 9 AM every day
    public void sendNotificationDigests() {
        List<NotificationPreferences> preferences = preferencesRepository.findAll();
        
        for (NotificationPreferences pref : preferences) {
            if (pref.isEmailDigestEnabled() && 
                (pref.getEmailDigestFrequency().equals("DAILY") || 
                 (pref.getEmailDigestFrequency().equals("WEEKLY") && isFirstDayOfWeek()))) {
                
                List<Notification> unreadNotifications = getUnreadNotifications(pref.getUserId());
                if (!unreadNotifications.isEmpty()) {
                    try {
                        var user = userRepository.findById(pref.getUserId()).orElseThrow();
                        emailService.sendNotificationDigestEmail(
                            user.getEmail(),
                            user.getFullName(),
                            unreadNotifications
                        );
                    } catch (MessagingException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
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

    public NotificationPreferences getNotificationPreferences(String userId) {
        return preferencesRepository.findByUserId(userId);
    }

    public NotificationPreferences updateNotificationPreferences(NotificationPreferences preferences) {
        return preferencesRepository.save(preferences);
    }

    public NotificationPreferences updateDeliveryMethod(String userId, String type, String method) {
        NotificationPreferences prefs = preferencesRepository.findByUserId(userId);
        if (prefs != null) {
            prefs.getDeliveryPreferences().put(type, method);
            return preferencesRepository.save(prefs);
        }
        return null;
    }

    public NotificationPreferences updateQuietHours(String userId, boolean enabled, String start, String end) {
        NotificationPreferences prefs = preferencesRepository.findByUserId(userId);
        if (prefs != null) {
            prefs.setQuietHoursEnabled(enabled);
            prefs.setQuietHoursStart(start);
            prefs.setQuietHoursEnd(end);
            return preferencesRepository.save(prefs);
        }
        return null;
    }

    public NotificationPreferences updateGrouping(String userId, boolean groupByType, boolean groupByDate) {
        NotificationPreferences prefs = preferencesRepository.findByUserId(userId);
        if (prefs != null) {
            prefs.setGroupByType(groupByType);
            prefs.setGroupByDate(groupByDate);
            return preferencesRepository.save(prefs);
        }
        return null;
    }

    public NotificationPreferences updateDigest(String userId, boolean enabled, String frequency) {
        NotificationPreferences prefs = preferencesRepository.findByUserId(userId);
        if (prefs != null) {
            prefs.setEmailDigestEnabled(enabled);
            prefs.setEmailDigestFrequency(frequency);
            return preferencesRepository.save(prefs);
        }
        return null;
    }
} 