package com.insurance.pricing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumBreakdownLine {

    private String label;
    private BigDecimal amount;
    private LineType type;
    private String reference;

    public enum LineType {
        BASE, LOADING, ADDON, DISCOUNT, TAX
    }
}
