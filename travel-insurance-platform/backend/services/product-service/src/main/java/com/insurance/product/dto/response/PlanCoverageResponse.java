package com.insurance.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanCoverageResponse {

    private String id;
    private String coverageTypeId;
    private String coverageCode;
    private BigDecimal defaultLimit;
    private BigDecimal minLimit;
    private BigDecimal maxLimit;
    private BigDecimal limitStep;
    private boolean adjustable;
    private boolean included;
    private BigDecimal deductible;
    private int sortOrder;
}
