package com.insurance.policy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyResponse {

    private String id;
    private String policyNumber;
    private String quoteId;
    private String customerId;
    private String planId;
    private String planCode;
    private String destinationZoneId;
    private String destinationCountryCode;
    private LocalDate tripStartDate;
    private LocalDate tripEndDate;
    private int tripDurationDays;
    private int numTravelers;
    private String status;
    private BigDecimal totalPremium;
    private BigDecimal riskScore;
    private String riskLevel;
    private LocalDateTime issuedAt;
    private String issuanceSnapshotId;
    private LocalDateTime createdAt;
}
