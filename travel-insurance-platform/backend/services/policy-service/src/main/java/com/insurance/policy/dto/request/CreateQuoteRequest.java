package com.insurance.policy.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class CreateQuoteRequest {

    @NotBlank(message = "Plan ID is required")
    private String planId;

    @NotBlank(message = "Destination zone ID is required")
    private String destinationZoneId;

    private String destinationCountryCode;

    @NotNull(message = "Trip start date is required")
    @FutureOrPresent(message = "Trip start date must be today or in the future")
    private LocalDate tripStartDate;

    @NotNull(message = "Trip end date is required")
    @Future(message = "Trip end date must be in the future")
    private LocalDate tripEndDate;

    @NotEmpty(message = "At least one traveler is required")
    @Valid
    private List<TravelerRequest> travelers;

    private Map<String, Object> coverageSelections;

    private List<String> selectedAddonIds;

    @Data
    public static class TravelerRequest {
        @NotBlank
        private String fullName;
        @NotNull
        @Past
        private LocalDate dateOfBirth;
        private String passportNumber;
        private String nationalityCode;
        private boolean primary;
    }
}
