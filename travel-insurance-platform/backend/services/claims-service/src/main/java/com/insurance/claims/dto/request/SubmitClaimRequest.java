package com.insurance.claims.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SubmitClaimRequest {

    @NotBlank(message = "Policy ID is required")
    private String policyId;

    @NotBlank(message = "Policy number is required")
    private String policyNumber;

    @NotBlank(message = "Policy snapshot ID is required")
    private String policySnapshotId;

    @NotBlank(message = "Claim type ID is required")
    private String claimTypeId;

    @NotBlank(message = "Claim type code is required")
    private String claimTypeCode;

    @NotNull(message = "Incident date is required")
    @PastOrPresent(message = "Incident date cannot be in the future")
    private LocalDate incidentDate;

    @NotBlank(message = "Incident description is required")
    private String incidentDescription;

    @NotNull(message = "Claimed amount is required")
    @DecimalMin(value = "0.01", message = "Claimed amount must be greater than zero")
    private BigDecimal claimedAmount;
}
