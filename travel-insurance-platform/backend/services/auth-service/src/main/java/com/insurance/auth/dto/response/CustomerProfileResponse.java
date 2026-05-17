package com.insurance.auth.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CustomerProfileResponse {
    private String id;
    private String userId;
    private LocalDate dateOfBirth;
    private String gender;
    private String nationality;
    private String passportNumber;
    private LocalDate passportExpiry;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String profilePhotoUrl;
    private LocalDateTime updatedAt;
}
