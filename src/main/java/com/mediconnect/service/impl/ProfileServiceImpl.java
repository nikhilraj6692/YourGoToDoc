package com.mediconnect.service.impl;

import com.mediconnect.dto.profile.ProfileResponse;
import com.mediconnect.model.User;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.service.ProfileService;
import com.mediconnect.util.UserContext;
import org.springframework.stereotype.Service;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;

    public ProfileServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public ProfileResponse getCurrentUserProfile() {
        String userEmail = UserContext.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return new ProfileResponse(user);
    }
} 