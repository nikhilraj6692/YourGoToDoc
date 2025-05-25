package com.mediconnect.service;

import com.mediconnect.dto.websocket.WebSocketNotification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendNotificationToUser(String userId, WebSocketNotification notification) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/notifications",
            notification
        );
    }

    public void sendNotificationToTopic(String topic, WebSocketNotification notification) {
        messagingTemplate.convertAndSend("/topic/" + topic, notification);
    }

    public void sendNotificationToUsers(Iterable<String> userIds, WebSocketNotification notification) {
        for (String userId : userIds) {
            sendNotificationToUser(userId, notification);
        }
    }
} 