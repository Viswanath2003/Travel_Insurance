package com.insurance.underwriting.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UwDecisionRequest {

    @NotBlank(message = "Decision reason is required")
    private String reason;

    private String premiumLoadingPercent;
    private String additionalConditions;
}
