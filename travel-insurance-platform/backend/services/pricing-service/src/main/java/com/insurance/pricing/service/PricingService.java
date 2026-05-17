package com.insurance.pricing.service;

import com.insurance.pricing.dto.request.PremiumCalculationRequest;
import com.insurance.pricing.dto.response.PremiumCalculationResponse;

public interface PricingService {

    PremiumCalculationResponse calculate(PremiumCalculationRequest request);
}
