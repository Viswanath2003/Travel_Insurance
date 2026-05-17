package com.insurance.underwriting.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UwCaseResponse {

    private String id;
    private String caseReference;
    private String policyId;
    private String policyNumber;
    private String customerId;
    private String currentState;
    private String assignedUnderwriterId;
    private LocalDateTime assignedAt;
    private LocalDateTime slaDueAt;
    private BigDecimal riskScore;
    private String riskLevel;
    private int uwLevel;
    private boolean locked;
    private String lockedBy;
    private String decisionReason;
    private LocalDateTime decidedAt;
    private String decidedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
