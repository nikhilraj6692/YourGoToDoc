package com.mediconnect.controller;

import com.mediconnect.model.NotificationPreferences;
import com.mediconnect.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications/preferences")
@Tag(name = "Notification Preferences", description = "APIs for managing notification preferences")
public class NotificationPreferencesController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get notification preferences", description = "Retrieves notification preferences for the current user")
    public ResponseEntity<NotificationPreferences> getPreferences(@RequestAttribute("userId") String userId) {
        return ResponseEntity.ok(notificationService.getNotificationPreferences(userId));
    }

    @PutMapping
    @Operation(summary = "Update notification preferences", description = "Updates notification preferences for the current user")
    public ResponseEntity<NotificationPreferences> updatePreferences(
            @RequestAttribute("userId") String userId,
            @RequestBody NotificationPreferences preferences) {
        preferences.setUserId(userId);
        return ResponseEntity.ok(notificationService.updateNotificationPreferences(preferences));
    }

    @PutMapping("/delivery-method")
    @Operation(summary = "Update delivery method", description = "Updates the delivery method for a specific notification type")
    public ResponseEntity<NotificationPreferences> updateDeliveryMethod(
            @RequestAttribute("userId") String userId,
            @RequestParam String type,
            @RequestParam String method) {
        return ResponseEntity.ok(notificationService.updateDeliveryMethod(userId, type, method));
    }

    @PutMapping("/quiet-hours")
    @Operation(summary = "Update quiet hours", description = "Updates quiet hours settings")
    public ResponseEntity<NotificationPreferences> updateQuietHours(
            @RequestAttribute("userId") String userId,
            @RequestParam boolean enabled,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        return ResponseEntity.ok(notificationService.updateQuietHours(userId, enabled, start, end));
    }

    @PutMapping("/grouping")
    @Operation(summary = "Update grouping preferences", description = "Updates notification grouping preferences")
    public ResponseEntity<NotificationPreferences> updateGrouping(
            @RequestAttribute("userId") String userId,
            @RequestParam boolean groupByType,
            @RequestParam boolean groupByDate) {
        return ResponseEntity.ok(notificationService.updateGrouping(userId, groupByType, groupByDate));
    }

    @PutMapping("/digest")
    @Operation(summary = "Update digest preferences", description = "Updates email digest preferences")
    public ResponseEntity<NotificationPreferences> updateDigest(
            @RequestAttribute("userId") String userId,
            @RequestParam boolean enabled,
            @RequestParam String frequency) {
        return ResponseEntity.ok(notificationService.updateDigest(userId, enabled, frequency));
    }
} 