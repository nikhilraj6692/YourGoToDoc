package com.mediconnect.dto.doctor;

import com.mediconnect.model.Address;
import lombok.Data;

import java.util.List;

@Data
public class DoctorProfileUpdateRequest {
    private String name;
    private String specialization;
    private Integer experience;
    private String qualification;
    private List<String> languages;
    private String about;
    private Address address;
    private Double consultationFee;
}