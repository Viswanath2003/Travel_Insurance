package com.insurance.pricing.service.impl;

import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.pricing.client.RuleEngineClient;
import com.insurance.pricing.client.dto.RuleEvaluationRequest;
import com.insurance.pricing.client.dto.RuleEvaluationResponse;
import com.insurance.pricing.dto.request.PremiumCalculationRequest;
import com.insurance.pricing.dto.request.TravelerInfo;
import com.insurance.pricing.dto.response.PremiumBreakdownLine;
import com.insurance.pricing.dto.response.PremiumBreakdownLine.LineType;
import com.insurance.pricing.dto.response.PremiumCalculationResponse;
import com.insurance.pricing.entity.AddonView;
import com.insurance.pricing.entity.PlanView;
import com.insurance.pricing.repository.AddonViewRepository;
import com.insurance.pricing.repository.PlanViewRepository;
import com.insurance.pricing.service.PricingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PricingServiceImpl implements PricingService {

    private final PlanViewRepository planViewRepository;
    private final AddonViewRepository addonViewRepository;
    private final RuleEngineClient ruleEngineClient;

    @Value("${app.pricing.tax-rate:0.09}")
    private BigDecimal taxRate;

    @Override
    @Transactional(readOnly = true)
    public PremiumCalculationResponse calculate(PremiumCalculationRequest request) {
        PlanView plan = planViewRepository.findActivePlanByCode(request.getPlanCode())
                .orElseThrow(() -> new ResourceNotFoundException("Plan", request.getPlanCode()));

        validateEligibility(plan, request);

        List<PremiumBreakdownLine> breakdown = new ArrayList<>();

        // Base premium
        BigDecimal base = plan.getBasePremium();
        breakdown.add(PremiumBreakdownLine.builder()
                .label("Base Premium")
                .amount(base)
                .type(LineType.BASE)
                .build());

        // Rule engine evaluation for loadings
        RuleEvaluationResponse ruleResult = evaluateRules(plan, request);
        BigDecimal loadingTotal = applyRuleActions(ruleResult, base, breakdown);

        // Add-on premiums
        BigDecimal addonTotal = applyAddons(request, base, breakdown);

        // Subtotal, tax, grand total
        BigDecimal subtotal = base.add(loadingTotal).add(addonTotal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);

        breakdown.add(PremiumBreakdownLine.builder()
                .label("Tax (" + taxRate.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%)")
                .amount(tax)
                .type(LineType.TAX)
                .build());

        return PremiumCalculationResponse.builder()
                .quoteReference(request.getQuoteReference())
                .planCode(plan.getPlanCode())
                .planName(plan.getPlanName())
                .basePremium(base)
                .loadingAmount(loadingTotal)
                .addonAmount(addonTotal)
                .discountAmount(BigDecimal.ZERO)
                .subtotal(subtotal)
                .taxAmount(tax)
                .grandTotal(grandTotal)
                .breakdown(breakdown)
                .riskLevel(ruleResult != null ? ruleResult.getRiskLevel() : "LOW")
                .requiresUnderwriting(plan.isRequiresUw() || (ruleResult != null && ruleResult.isRequiresUnderwriting()))
                .build();
    }

    private void validateEligibility(PlanView plan, PremiumCalculationRequest request) {
        if (plan.getMaxTripDurationDays() != null && request.getTripDurationDays() > plan.getMaxTripDurationDays()) {
            throw new BusinessRuleException("Trip duration exceeds maximum allowed for plan " + plan.getPlanCode());
        }
        if (plan.getMaxTravelers() != null && request.getTravelerCount() > plan.getMaxTravelers()) {
            throw new BusinessRuleException("Traveler count exceeds maximum allowed for plan " + plan.getPlanCode());
        }
        for (TravelerInfo t : request.getTravelers()) {
            if (plan.getMinAge() != null && t.getAge() < plan.getMinAge()) {
                throw new BusinessRuleException("Traveler age " + t.getAge() + " is below minimum age for plan " + plan.getPlanCode());
            }
            if (plan.getMaxAge() != null && t.getAge() > plan.getMaxAge()) {
                throw new BusinessRuleException("Traveler age " + t.getAge() + " exceeds maximum age for plan " + plan.getPlanCode());
            }
        }
    }

    private RuleEvaluationResponse evaluateRules(PlanView plan, PremiumCalculationRequest request) {
        Map<String, Object> facts = new HashMap<>();
        facts.put("planCode", plan.getPlanCode());
        facts.put("tripDurationDays", request.getTripDurationDays());
        facts.put("travelerCount", request.getTravelerCount());
        facts.put("destinationZoneCode", request.getDestinationZoneCode());

        int maxAge = request.getTravelers().stream()
                .mapToInt(TravelerInfo::getAge)
                .max()
                .orElse(0);
        facts.put("maxTravelerAge", maxAge);

        List<Integer> ages = request.getTravelers().stream()
                .map(TravelerInfo::getAge)
                .toList();
        facts.put("travelerAges", ages);

        RuleEvaluationRequest ruleRequest = RuleEvaluationRequest.builder()
                .ruleType("PRICING")
                .facts(facts)
                .contextReference(request.getQuoteReference())
                .build();

        try {
            return ruleEngineClient.evaluate(ruleRequest);
        } catch (Exception ex) {
            log.warn("Rule engine evaluation failed, proceeding with base premium only: {}", ex.getMessage());
            return null;
        }
    }

    private BigDecimal applyRuleActions(RuleEvaluationResponse ruleResult, BigDecimal base,
                                        List<PremiumBreakdownLine> breakdown) {
        BigDecimal loadingTotal = BigDecimal.ZERO;
        if (ruleResult == null || CollectionUtils.isEmpty(ruleResult.getAppliedActions())) {
            return loadingTotal;
        }

        for (RuleEvaluationResponse.ActionResult action : ruleResult.getAppliedActions()) {
            BigDecimal amount = BigDecimal.ZERO;
            switch (action.getActionType()) {
                case "ADD_FLAT_AMOUNT" -> amount = action.getValue().setScale(2, RoundingMode.HALF_UP);
                case "ADD_PERCENT" -> amount = base.multiply(action.getValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                case "SUBTRACT_PERCENT" -> amount = base.multiply(action.getValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP).negate();
                case "MULTIPLY_PREMIUM" -> {
                    BigDecimal multiplied = base.multiply(action.getValue()).setScale(2, RoundingMode.HALF_UP);
                    amount = multiplied.subtract(base);
                }
                default -> {
                    continue;
                }
            }

            if (amount.compareTo(BigDecimal.ZERO) != 0) {
                loadingTotal = loadingTotal.add(amount);
                breakdown.add(PremiumBreakdownLine.builder()
                        .label(action.getLabel() != null ? action.getLabel() : action.getActionType())
                        .amount(amount)
                        .type(amount.compareTo(BigDecimal.ZERO) >= 0 ? LineType.LOADING : LineType.DISCOUNT)
                        .build());
            }
        }
        return loadingTotal;
    }

    private BigDecimal applyAddons(PremiumCalculationRequest request, BigDecimal base,
                                   List<PremiumBreakdownLine> breakdown) {
        if (CollectionUtils.isEmpty(request.getSelectedAddonCodes())) {
            return BigDecimal.ZERO;
        }

        List<AddonView> addons = addonViewRepository.findByAddonCodeInAndActiveTrue(request.getSelectedAddonCodes());
        BigDecimal addonTotal = BigDecimal.ZERO;

        for (AddonView addon : addons) {
            BigDecimal amount = switch (addon.getPricingType()) {
                case "FLAT" -> addon.getPricingValue().setScale(2, RoundingMode.HALF_UP);
                case "PERCENT_OF_BASE" -> base.multiply(addon.getPricingValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                case "PER_DAY" -> addon.getPricingValue()
                        .multiply(BigDecimal.valueOf(request.getTripDurationDays()))
                        .setScale(2, RoundingMode.HALF_UP);
                case "PER_TRAVELER" -> addon.getPricingValue()
                        .multiply(BigDecimal.valueOf(request.getTravelerCount()))
                        .setScale(2, RoundingMode.HALF_UP);
                default -> BigDecimal.ZERO;
            };

            addonTotal = addonTotal.add(amount);
            breakdown.add(PremiumBreakdownLine.builder()
                    .label(addon.getAddonName())
                    .amount(amount)
                    .type(LineType.ADDON)
                    .reference(addon.getAddonCode())
                    .build());
        }
        return addonTotal;
    }
}
