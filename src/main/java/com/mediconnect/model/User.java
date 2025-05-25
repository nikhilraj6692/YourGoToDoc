package com.mediconnect.model;

import com.mediconnect.enums.Status;
import com.mediconnect.enums.UserRole;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import com.mediconnect.model.Address;

@Document(collection = "users")
@Getter
@Setter
public class User extends BaseEntity {
    
    @Id
    private String id;
    private String fullName;
    private String email;
    private String password;
    private Long phoneNumber;
    private Address address;
    private UserRole role;
    private Status status;
    private String statusReason;
    private String profilePhotoId;
    private String profilePhotoUrl;

    public List<String> getAuthorities() {
        List<String> authorities = new ArrayList<>();
        authorities.add("ROLE_" + role);
        return authorities;
    }

    public static User fromDocument(org.bson.Document doc) {
        User user = new User();
        user.setId(doc.getObjectId("_id") != null ? doc.getObjectId("_id").toHexString() : doc.getString("id"));
        user.setEmail(doc.getString("email"));
        user.setPassword(doc.getString("password"));
        user.setRole(UserRole.valueOf(doc.getString("role")));
        user.setStatus(Status.valueOf(doc.getString("status")));
        user.setFullName(doc.getString("fullName"));
        user.setPhoneNumber(doc.getLong("phoneNumber"));
        user.setAddress(Address.fromDocument(doc.get("address", org.bson.Document.class)));
        user.setStatusReason(doc.getString("statusReason"));
        user.setProfilePhotoId(doc.getString("profilePhotoId"));
        user.setProfilePhotoUrl(doc.getString("profilePhotoUrl"));
        if (doc.get("createdAt") != null) user.setCreatedAt((java.time.LocalDateTime) doc.get("createdAt"));
        if (doc.get("updatedAt") != null) user.setUpdatedAt((java.time.LocalDateTime) doc.get("updatedAt"));
        return user;
    }

    public org.bson.Document toDocument() {
        org.bson.Document doc = new org.bson.Document();
        if (id != null) doc.append("id", id);
        doc.append("email", email);
        doc.append("password", password);
        doc.append("role", role);
        doc.append("status", status);
        doc.append("fullName", fullName);
        doc.append("phoneNumber", phoneNumber);
        doc.append("address", address.toDocument());
        doc.append("statusReason", statusReason);
        doc.append("profilePhotoId", profilePhotoId);
        doc.append("profilePhotoUrl", profilePhotoUrl);
        if (createdAt != null) doc.append("createdAt", createdAt);
        if (updatedAt != null) doc.append("updatedAt", updatedAt);
        return doc;
    }


} 