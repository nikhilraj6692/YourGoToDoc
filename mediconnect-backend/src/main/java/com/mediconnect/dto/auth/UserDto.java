package com.mediconnect.dto.auth;

import com.mediconnect.enums.UserRole;
import com.mediconnect.model.Address;
import com.mediconnect.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String id;
    private String email;
    private UserRole role;
    private String fullName;
    private Long phoneNumber;
    private Address address;
} 