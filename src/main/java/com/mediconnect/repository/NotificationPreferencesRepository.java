package com.mediconnect.repository;

import com.mediconnect.model.NotificationPreferences;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationPreferencesRepository extends MongoRepository<NotificationPreferences, String> {
    NotificationPreferences findByUserId(String userId);
} 