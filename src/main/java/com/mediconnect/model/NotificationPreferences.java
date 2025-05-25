package com.mediconnect.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Data
@Document(collection = "notification_preferences")
@Schema(description = "User notification preferences")
public class NotificationPreferences {
    @Id
    @Schema(description = "Unique identifier for the preferences")
    private String id;

    @Schema(description = "User ID associated with these preferences")
    private String userId;

    @Schema(description = "Map of notification types to their delivery methods (EMAIL, IN_APP, BOTH, NONE)")
    private Map<String, String> deliveryPreferences;

    @Schema(description = "Whether to group notifications by type")
    private boolean groupByType;

    @Schema(description = "Whether to group notifications by date")
    private boolean groupByDate;

    @Schema(description = "Default delivery method for notifications")
    private String defaultDeliveryMethod;

    @Schema(description = "Whether to receive notifications during quiet hours")
    private boolean quietHoursEnabled;

    @Schema(description = "Start of quiet hours (24-hour format)")
    private String quietHoursStart;

    @Schema(description = "End of quiet hours (24-hour format)")
    private String quietHoursEnd;

    @Schema(description = "Whether to receive email digests for grouped notifications")
    private boolean emailDigestEnabled;

    @Schema(description = "Frequency of email digests (DAILY, WEEKLY)")
    private String emailDigestFrequency;
} 