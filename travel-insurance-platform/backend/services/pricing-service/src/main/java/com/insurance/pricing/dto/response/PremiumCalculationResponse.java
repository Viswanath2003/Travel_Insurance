package com.insurance.pricing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumCalculationResponse {

    private String quoteReference;
    private String planCode;
    private String planName;

    private BigDecimal basePremium;
    private BigDecimal loadingAmount;
    private BigDecimal addonAmount;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;

    private List<PremiumBreakdownLine> breakdown;

    private String riskLevel;
    private boolean requiresUnderwriting;

    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
