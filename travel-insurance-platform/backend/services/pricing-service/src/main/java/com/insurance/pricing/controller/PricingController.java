package com.insurance.pricing.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.pricing.dto.request.PremiumCalculationRequest;
import com.insurance.pricing.dto.response.PremiumCalculationResponse;
import com.insurance.pricing.service.PricingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/pricing")
@RequiredArgsConstructor
@Tag(name = "Pricing", description = "Premium calculation APIs")
@SecurityRequirement(name = "bearerAuth")
public class PricingController {

    private final PricingService pricingService;

    @PostMapping("/calculate")
    @PreAuthorize("hasAuthority('QUOTE_CREATE') or hasAuthority('POLICY_CREATE')")
    @Operation(summary = "Calculate premium for a plan and traveler combination")
    public ResponseEntity<ApiResponse<PremiumCalculationResponse>> calculate(
            @Valid @RequestBody PremiumCalculationRequest request) {
        PremiumCalculationResponse result = pricingService.calculate(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
