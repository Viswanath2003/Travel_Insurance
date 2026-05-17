package com.insurance.claims.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ClaimDecisionRequest {

    @NotBlank(message = "Decision reason is required")
    private String reason;

    private BigDecimal approvedAmount;
    private String additionalNotes;
}
