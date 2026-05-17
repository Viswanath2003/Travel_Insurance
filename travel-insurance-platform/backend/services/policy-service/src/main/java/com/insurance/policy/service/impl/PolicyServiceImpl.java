package com.insurance.policy.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.security.SecurityUtils;
import com.insurance.common.util.ReferenceNumberGenerator;
import com.insurance.policy.dto.response.PolicyResponse;
import com.insurance.policy.entity.Policy;
import com.insurance.policy.entity.Policy.PolicyStatus;
import com.insurance.policy.entity.PolicySnapshot;
import com.insurance.policy.entity.Quote;
import com.insurance.policy.repository.PolicyRepository;
import com.insurance.policy.repository.PolicySnapshotRepository;
import com.insurance.policy.repository.QuoteRepository;
import com.insurance.policy.service.PolicyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyServiceImpl implements PolicyService {

    private final PolicyRepository policyRepository;
    private final PolicySnapshotRepository policySnapshotRepository;
    private final QuoteRepository quoteRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PolicyResponse issuePolicyFromQuote(String quoteId) {
        Quote quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", quoteId));

        if (quote.getStatus() != Quote.QuoteStatus.READY) {
            throw new BusinessRuleException("Quote must be in READY state to issue a policy");
        }
        if (quote.getExpiresAt() != null && LocalDateTime.now().isAfter(quote.getExpiresAt())) {
            throw new BusinessRuleException("Quote has expired");
        }

        Policy policy = new Policy();
        policy.setPolicyNumber(ReferenceNumberGenerator.generatePolicyNumber());
        policy.setQuoteId(quote.getId());
        policy.setCustomerId(quote.getCustomerId());
        policy.setPlanId(quote.getPlanId());
        policy.setPlanCode(quote.getPlanCode());
        policy.setDestinationZoneId(quote.getDestinationZoneId());
        policy.setDestinationCountryCode(quote.getDestinationCountryCode());
        policy.setTripStartDate(quote.getTripStartDate());
        policy.setTripEndDate(quote.getTripEndDate());
        policy.setTripDurationDays(quote.getTripDurationDays());
        policy.setNumTravelers(quote.getNumTravelers());
        policy.setTotalPremium(quote.getTotalPremium());
        policy.setRiskScore(quote.getRiskScore());
        policy.setRiskLevel(quote.getRiskLevel() != null
                ? Policy.RiskLevel.valueOf(quote.getRiskLevel().name()) : null);

        PolicyStatus initialStatus = quote.isRequiresUw()
                ? PolicyStatus.PENDING_UW : PolicyStatus.PENDING_PAYMENT;
        policy.setStatus(initialStatus);
        policy.setIssuedAt(LocalDateTime.now());

        Policy saved = policyRepository.save(policy);

        // Create issuance snapshot
        PolicySnapshot snapshot = createSnapshot(saved, quote);
        PolicySnapshot savedSnapshot = policySnapshotRepository.save(snapshot);
        saved.setIssuanceSnapshotId(savedSnapshot.getId());
        policyRepository.save(saved);

        // Mark quote as converted
        quote.setStatus(Quote.QuoteStatus.CONVERTED);
        quoteRepository.save(quote);

        log.info("Policy issued: {} from quote: {}", saved.getPolicyNumber(), quote.getQuoteReference());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PolicyResponse getPolicyById(String policyId) {
        return toResponse(findById(policyId));
    }

    @Override
    @Transactional(readOnly = true)
    public PolicyResponse getPolicyByNumber(String policyNumber) {
        Policy p = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy", policyNumber));
        return toResponse(p);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PolicyResponse> getMyPolicies(Pageable pageable) {
        String userId = SecurityUtils.getCurrentUserId();
        Page<Policy> page = policyRepository.findByCustomerId(userId, pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PolicyResponse> getAllPolicies(Pageable pageable) {
        Page<Policy> page = policyRepository.findAll(pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional
    public void activatePolicy(String policyId) {
        Policy p = findById(policyId);
        if (p.getStatus() != PolicyStatus.PENDING_PAYMENT && p.getStatus() != PolicyStatus.PENDING_UW) {
            throw new BusinessRuleException("Policy cannot be activated in state: " + p.getStatus());
        }
        p.setStatus(PolicyStatus.ACTIVE);
        policyRepository.save(p);
        log.info("Policy activated: {}", p.getPolicyNumber());
    }

    @Override
    @Transactional
    public void rejectPolicy(String policyId, String reason) {
        Policy p = findById(policyId);
        if (p.getStatus() == PolicyStatus.CANCELLED || p.getStatus() == PolicyStatus.REJECTED) {
            throw new BusinessRuleException("Policy is already in terminal state: " + p.getStatus());
        }
        p.setStatus(PolicyStatus.REJECTED);
        policyRepository.save(p);
        log.info("Policy rejected: {} reason: {}", p.getPolicyNumber(), reason);
    }

    @Override
    @Transactional
    public void cancelPolicy(String policyId, String reason) {
        Policy p = findById(policyId);
        if (p.getStatus() != PolicyStatus.ACTIVE && p.getStatus() != PolicyStatus.PENDING_PAYMENT) {
            throw new BusinessRuleException("Policy cannot be cancelled in state: " + p.getStatus());
        }
        p.setStatus(PolicyStatus.CANCELLED);
        policyRepository.save(p);
        log.info("Policy cancelled: {} reason: {}", p.getPolicyNumber(), reason);
    }

    // --- helpers ---

    private Policy findById(String policyId) {
        return policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy", policyId));
    }

    private PolicySnapshot createSnapshot(Policy policy, Quote quote) {
        Map<String, Object> data = new HashMap<>();
        data.put("policyNumber", policy.getPolicyNumber());
        data.put("planId", policy.getPlanId());
        data.put("planCode", policy.getPlanCode());
        data.put("customerId", policy.getCustomerId());
        data.put("destinationZoneId", policy.getDestinationZoneId());
        data.put("destinationCountryCode", policy.getDestinationCountryCode());
        data.put("tripStartDate", policy.getTripStartDate().toString());
        data.put("tripEndDate", policy.getTripEndDate().toString());
        data.put("tripDurationDays", policy.getTripDurationDays());
        data.put("numTravelers", policy.getNumTravelers());
        data.put("totalPremium", policy.getTotalPremium());
        data.put("riskLevel", policy.getRiskLevel() != null ? policy.getRiskLevel().name() : null);

        String json;
        try {
            json = objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize policy snapshot", e);
        }

        PolicySnapshot snapshot = new PolicySnapshot();
        snapshot.setPolicyId(policy.getId());
        snapshot.setPolicyNumber(policy.getPolicyNumber());
        snapshot.setSnapshotType(PolicySnapshot.SnapshotType.ISSUANCE);
        snapshot.setSnapshotData(json);
        snapshot.setPolicyVersion(policy.getVersion() != null ? policy.getVersion() : 0L);
        snapshot.setCreatedBy(SecurityUtils.getCurrentUserId());
        return snapshot;
    }

    private PolicyResponse toResponse(Policy p) {
        return PolicyResponse.builder()
                .id(p.getId())
                .policyNumber(p.getPolicyNumber())
                .quoteId(p.getQuoteId())
                .customerId(p.getCustomerId())
                .planId(p.getPlanId())
                .planCode(p.getPlanCode())
                .destinationZoneId(p.getDestinationZoneId())
                .destinationCountryCode(p.getDestinationCountryCode())
                .tripStartDate(p.getTripStartDate())
                .tripEndDate(p.getTripEndDate())
                .tripDurationDays(p.getTripDurationDays())
                .numTravelers(p.getNumTravelers())
                .status(p.getStatus().name())
                .totalPremium(p.getTotalPremium())
                .riskScore(p.getRiskScore())
                .riskLevel(p.getRiskLevel() != null ? p.getRiskLevel().name() : null)
                .issuedAt(p.getIssuedAt())
                .issuanceSnapshotId(p.getIssuanceSnapshotId())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
