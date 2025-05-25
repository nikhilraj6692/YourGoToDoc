package com.mediconnect.dto.websocket;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "WebSocket notification message")
public class WebSocketNotification {
    @Schema(description = "Type of notification")
    private String type;

    @Schema(description = "Title of the notification")
    private String title;

    @Schema(description = "Message content")
    private String message;

    @Schema(description = "Related entity ID (e.g., appointment ID)")
    private String relatedId;

    @Schema(description = "Timestamp of the notification")
    private Long timestamp;

    public WebSocketNotification() {
        this.timestamp = System.currentTimeMillis();
    }
} 