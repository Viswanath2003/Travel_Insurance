package com.insurance.policy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteResponse {

    private String id;
    private String quoteReference;
    private String planId;
    private String planCode;
    private String destinationZoneId;
    private String destinationCountryCode;
    private LocalDate tripStartDate;
    private LocalDate tripEndDate;
    private int tripDurationDays;
    private int numTravelers;
    private String status;
    private BigDecimal basePremium;
    private BigDecimal loadingPercent;
    private BigDecimal loadingAmount;
    private BigDecimal addonAmount;
    private BigDecimal netPremium;
    private BigDecimal taxPercent;
    private BigDecimal taxAmount;
    private BigDecimal totalPremium;
    private BigDecimal riskScore;
    private String riskLevel;
    private boolean requiresUw;
    private LocalDateTime expiresAt;
    private List<TravelerDetail> travelers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TravelerDetail {
        private String id;
        private String fullName;
        private LocalDate dateOfBirth;
        private int age;
        private boolean primary;
    }
}
