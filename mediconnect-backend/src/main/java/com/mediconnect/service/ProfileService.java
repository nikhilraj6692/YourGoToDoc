package com.mediconnect.service;

import com.mediconnect.dto.profile.ProfileResponse;

public interface ProfileService {
    /**
     * Get the profile of the currently authenticated user
     * @return User profile without sensitive information
     */
    ProfileResponse getCurrentUserProfile();
} 