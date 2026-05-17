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
public class AddonSummaryResponse {

    private String id;
    private String addonCode;
    private String addonName;
    private String description;
    private String pricingType;
    private BigDecimal pricingValue;
    private String coverageTypeCode;
    private BigDecimal coverageLimit;
}
