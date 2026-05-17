package com.insurance.auth.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProfileRequest {
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
}
