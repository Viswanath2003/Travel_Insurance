package com.insurance.claims.dto.response;

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
public class ClaimResponse {

    private String id;
    private String claimReference;
    private String policyId;
    private String policyNumber;
    private String customerId;
    private String claimTypeCode;
    private String status;
    private LocalDate incidentDate;
    private String incidentDescription;
    private BigDecimal claimedAmount;
    private BigDecimal approvedAmount;
    private String assignedOfficerId;
    private LocalDateTime slaDueAt;
    private String decisionReason;
    private LocalDateTime decidedAt;
    private String decidedBy;
    private boolean highValue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
