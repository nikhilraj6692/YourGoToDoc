package com.mediconnect.controller;

import com.mediconnect.dto.websocket.WebSocketNotification;
import com.mediconnect.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

@Controller
@Tag(name = "WebSocket", description = "WebSocket endpoints for real-time notifications")
public class WebSocketController {

    @Autowired
    private NotificationService notificationService;

    @SubscribeMapping("/user/queue/notifications")
    @Operation(summary = "Subscribe to notifications", description = "Subscribe to receive real-time notifications")
    public void subscribeToNotifications() {
        // This method is called when a client subscribes to the notifications queue
        // No need to return anything as the subscription is handled automatically
    }

    @MessageMapping("/notifications/mark-read")
    @Operation(summary = "Mark notification as read", description = "Mark a notification as read via WebSocket")
    public void markNotificationAsRead(@Payload String notificationId) {
        notificationService.markNotificationAsRead(notificationId);
    }
} 