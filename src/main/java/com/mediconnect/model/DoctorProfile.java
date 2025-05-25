package com.mediconnect.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mediconnect.enums.DocumentType;
import com.mediconnect.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Document(collection = "doctor_profiles")
@Getter
@Setter
public class DoctorProfile extends BaseEntity {

    @Id
    private String id;

    private String userId;
    private String specialization;
    private String licenseNumber;
    private Integer yearsOfExperience;
    private String bio;
    private String licenseDocumentUrl;
    private String identityDocumentUrl;
    private String qualificationDocumentUrl;
    private String photoUrl;
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    private List<ReasonHistory> reasons;
    private LocalDateTime verifiedAt;

    public void setReasons(ReasonHistory reason) {
        if(this.reasons == null) {
            List<ReasonHistory> reasons = new ArrayList<>();
            reasons.add(reason);
            this.reasons = reasons;
        }
        else {
            this.reasons.add(0, reason);
        }
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class ReasonHistory {
        private String reason;
        private LocalDateTime reasonDate;
    }

    @Getter
    @Setter
    public static class UploadedDocument {
        private String documentId;
        @JsonIgnore
        private String url;
        private DocumentType type;

        @Override
        public boolean equals(Object o) {
            if (o == null || getClass() != o.getClass()) return false;
            UploadedDocument that = (UploadedDocument) o;
            return type == that.type;
        }

        @Override
        public int hashCode() {
            return Objects.hashCode(type);
        }
    }
    private Map<DocumentType, UploadedDocument> documents = new HashMap<>();

}