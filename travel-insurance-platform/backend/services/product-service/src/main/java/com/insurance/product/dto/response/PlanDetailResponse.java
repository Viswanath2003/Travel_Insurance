package com.insurance.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanDetailResponse {

    private String id;
    private String planCode;
    private String planName;
    private String description;
    private BigDecimal basePremium;
    private Integer maxTripDurationDays;
    private Integer maxTravelers;
    private Integer minAge;
    private Integer maxAge;
    private boolean requiresUw;
    private List<PlanCoverageResponse> coverages;
    private List<AddonSummaryResponse> availableAddons;
}
