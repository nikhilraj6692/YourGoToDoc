package com.mediconnect.dto.profile;

import com.mediconnect.model.User;
import com.mediconnect.model.Address;

public class ProfileResponse {
    private String id;
    private String fullName;
    private String email;
    private Long phoneNumber;
    private Address address;
    private String role;
    private String status;
    private String profilePhotoUrl;

    public ProfileResponse(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.phoneNumber = user.getPhoneNumber();
        this.address = user.getAddress();
        this.role = user.getRole().name();
        this.status = user.getStatus().name();
        this.profilePhotoUrl = user.getProfilePhotoUrl();
    }

    // Getters
    public String getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Long getPhoneNumber() { return phoneNumber; }
    public Address getAddress() { return address; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
} 