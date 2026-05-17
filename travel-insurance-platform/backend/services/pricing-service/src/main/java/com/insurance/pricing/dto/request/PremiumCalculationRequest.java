package com.insurance.pricing.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PremiumCalculationRequest {

    @NotBlank
    private String planCode;

    @NotNull
    @Min(1)
    @Max(10)
    private Integer travelerCount;

    @NotEmpty
    @Valid
    private List<TravelerInfo> travelers;

    @NotNull
    @Min(1)
    @Max(365)
    private Integer tripDurationDays;

    @NotBlank
    private String destinationZoneCode;

    private List<String> selectedAddonCodes;

    // coverageCode -> desired limit override
    private Map<String, BigDecimal> coverageOverrides;

    private String quoteReference;
}
