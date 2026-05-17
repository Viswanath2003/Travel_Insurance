package com.insurance.product.service.impl;

import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.product.dto.response.AddonSummaryResponse;
import com.insurance.product.dto.response.PlanCoverageResponse;
import com.insurance.product.dto.response.PlanDetailResponse;
import com.insurance.product.dto.response.PlanSummaryResponse;
import com.insurance.product.entity.Addon;
import com.insurance.product.entity.Plan;
import com.insurance.product.entity.PlanCoverage;
import com.insurance.product.repository.AddonRepository;
import com.insurance.product.repository.PlanRepository;
import com.insurance.product.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanServiceImpl implements PlanService {

    private final PlanRepository planRepository;
    private final AddonRepository addonRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PlanSummaryResponse> getActivePlans() {
        return planRepository.findByActiveTrue().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PlanDetailResponse getPlanById(String planId) {
        Plan plan = planRepository.findByIdWithCoverages(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", planId));
        return toDetail(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public PlanDetailResponse getPlanByCode(String planCode) {
        Plan plan = planRepository.findByPlanCode(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", planCode));
        return toDetail(plan);
    }

    private PlanSummaryResponse toSummary(Plan plan) {
        return PlanSummaryResponse.builder()
                .id(plan.getId())
                .planCode(plan.getPlanCode())
                .planName(plan.getPlanName())
                .description(plan.getDescription())
                .basePremium(plan.getBasePremium())
                .maxTripDurationDays(plan.getMaxTripDurationDays())
                .maxTravelers(plan.getMaxTravelers())
                .minAge(plan.getMinAge())
                .maxAge(plan.getMaxAge())
                .requiresUw(plan.isRequiresUw())
                .sortOrder(plan.getSortOrder())
                .build();
    }

    private PlanDetailResponse toDetail(Plan plan) {
        List<PlanCoverageResponse> coverages = plan.getCoverages().stream()
                .map(this::toCoverageResponse)
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .collect(Collectors.toList());

        List<AddonSummaryResponse> addons = addonRepository.findByActiveTrue().stream()
                .map(this::toAddonResponse)
                .collect(Collectors.toList());

        return PlanDetailResponse.builder()
                .id(plan.getId())
                .planCode(plan.getPlanCode())
                .planName(plan.getPlanName())
                .description(plan.getDescription())
                .basePremium(plan.getBasePremium())
                .maxTripDurationDays(plan.getMaxTripDurationDays())
                .maxTravelers(plan.getMaxTravelers())
                .minAge(plan.getMinAge())
                .maxAge(plan.getMaxAge())
                .requiresUw(plan.isRequiresUw())
                .coverages(coverages)
                .availableAddons(addons)
                .build();
    }

    private PlanCoverageResponse toCoverageResponse(PlanCoverage c) {
        return PlanCoverageResponse.builder()
                .id(c.getId())
                .coverageTypeId(c.getCoverageTypeId())
                .coverageCode(c.getCoverageCode())
                .defaultLimit(c.getDefaultLimit())
                .minLimit(c.getMinLimit())
                .maxLimit(c.getMaxLimit())
                .limitStep(c.getLimitStep())
                .adjustable(c.isAdjustable())
                .included(c.isIncluded())
                .deductible(c.getDeductible())
                .sortOrder(c.getSortOrder())
                .build();
    }

    private AddonSummaryResponse toAddonResponse(Addon a) {
        return AddonSummaryResponse.builder()
                .id(a.getId())
                .addonCode(a.getAddonCode())
                .addonName(a.getAddonName())
                .description(a.getDescription())
                .pricingType(a.getPricingType().name())
                .pricingValue(a.getPricingValue())
                .coverageTypeCode(a.getCoverageTypeCode())
                .coverageLimit(a.getCoverageLimit())
                .build();
    }
}
