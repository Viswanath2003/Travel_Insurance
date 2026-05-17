package com.insurance.policy.service.impl;

import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.security.SecurityUtils;
import com.insurance.common.util.ReferenceNumberGenerator;
import com.insurance.policy.client.PricingServiceClient;
import com.insurance.policy.dto.request.CreateQuoteRequest;
import com.insurance.policy.dto.response.QuoteResponse;
import com.insurance.policy.entity.Quote;
import com.insurance.policy.entity.Quote.QuoteStatus;
import com.insurance.policy.entity.QuoteTraveler;
import com.insurance.policy.repository.QuoteRepository;
import com.insurance.policy.service.QuoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRepository quoteRepository;
    private final PricingServiceClient pricingServiceClient;

    @Value("${app.quote.validity-hours:48}")
    private int quoteValidityHours;

    @Override
    @Transactional
    public QuoteResponse createQuote(CreateQuoteRequest request) {
        int tripDays = (int) request.getTripStartDate().until(request.getTripEndDate()).getDays();
        if (tripDays <= 0) {
            throw new BusinessRuleException("Trip end date must be after start date");
        }

        Quote quote = new Quote();
        quote.setQuoteReference(ReferenceNumberGenerator.generateQuoteReference());
        quote.setCustomerId(SecurityUtils.getCurrentUserId());
        quote.setPlanId(request.getPlanId());
        quote.setDestinationZoneId(request.getDestinationZoneId());
        quote.setDestinationCountryCode(request.getDestinationCountryCode());
        quote.setTripStartDate(request.getTripStartDate());
        quote.setTripEndDate(request.getTripEndDate());
        quote.setTripDurationDays(tripDays);
        quote.setNumTravelers(request.getTravelers().size());
        quote.setStatus(QuoteStatus.DRAFT);
        quote.setExpiresAt(LocalDateTime.now().plusHours(quoteValidityHours));

        List<QuoteTraveler> travelers = buildTravelers(request, quote);
        quote.setTravelers(travelers);

        // Call pricing service
        Map<String, Object> pricingResult = callPricing(quote, request);
        applyPricingResult(quote, pricingResult);

        quote.setStatus(QuoteStatus.READY);
        Quote saved = quoteRepository.save(quote);
        log.info("Quote created: {}", saved.getQuoteReference());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteResponse getQuoteById(String quoteId) {
        return toResponse(findById(quoteId));
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteResponse getQuoteByReference(String quoteReference) {
        Quote q = quoteRepository.findByQuoteReference(quoteReference)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", quoteReference));
        return toResponse(q);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<QuoteResponse> getMyQuotes(Pageable pageable) {
        String userId = SecurityUtils.getCurrentUserId();
        Page<Quote> page = quoteRepository.findByCustomerId(userId, pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional
    public QuoteResponse recalculateQuote(String quoteId, CreateQuoteRequest request) {
        Quote quote = findById(quoteId);
        if (quote.getStatus() == QuoteStatus.CONVERTED || quote.getStatus() == QuoteStatus.EXPIRED) {
            throw new BusinessRuleException("Cannot recalculate a " + quote.getStatus() + " quote");
        }

        int tripDays = (int) request.getTripStartDate().until(request.getTripEndDate()).getDays();
        quote.setTripStartDate(request.getTripStartDate());
        quote.setTripEndDate(request.getTripEndDate());
        quote.setTripDurationDays(tripDays);
        quote.setDestinationZoneId(request.getDestinationZoneId());
        quote.setDestinationCountryCode(request.getDestinationCountryCode());
        quote.setNumTravelers(request.getTravelers().size());
        quote.getTravelers().clear();
        quote.getTravelers().addAll(buildTravelers(request, quote));
        quote.setExpiresAt(LocalDateTime.now().plusHours(quoteValidityHours));

        Map<String, Object> pricingResult = callPricing(quote, request);
        applyPricingResult(quote, pricingResult);
        quote.setStatus(QuoteStatus.READY);

        return toResponse(quoteRepository.save(quote));
    }

    // --- helpers ---

    private Quote findById(String quoteId) {
        return quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", quoteId));
    }

    private List<QuoteTraveler> buildTravelers(CreateQuoteRequest request, Quote quote) {
        List<QuoteTraveler> travelers = new ArrayList<>();
        int order = 1;
        for (CreateQuoteRequest.TravelerRequest tr : request.getTravelers()) {
            QuoteTraveler t = new QuoteTraveler();
            t.setQuote(quote);
            t.setFullName(tr.getFullName());
            t.setDateOfBirth(tr.getDateOfBirth());
            t.setAge(Period.between(tr.getDateOfBirth(), LocalDate.now()).getYears());
            t.setPassportNumber(tr.getPassportNumber());
            t.setNationalityCode(tr.getNationalityCode());
            t.setPrimary(tr.isPrimary());
            t.setSortOrder(order++);
            travelers.add(t);
        }
        return travelers;
    }

    private Map<String, Object> callPricing(Quote quote, CreateQuoteRequest request) {
        Map<String, Object> pricingRequest = new HashMap<>();
        pricingRequest.put("planCode", quote.getPlanId());
        pricingRequest.put("travelerCount", quote.getNumTravelers());
        pricingRequest.put("tripDurationDays", quote.getTripDurationDays());
        pricingRequest.put("destinationZoneCode", quote.getDestinationZoneId());
        pricingRequest.put("quoteReference", quote.getQuoteReference());
        if (request.getSelectedAddonIds() != null) {
            pricingRequest.put("selectedAddonCodes", request.getSelectedAddonIds());
        }

        List<Map<String, Object>> travelerList = new ArrayList<>();
        for (QuoteTraveler t : quote.getTravelers()) {
            Map<String, Object> tMap = new HashMap<>();
            tMap.put("age", t.getAge());
            tMap.put("isPrimary", t.isPrimary());
            travelerList.add(tMap);
        }
        pricingRequest.put("travelers", travelerList);

        return pricingServiceClient.calculatePremium(pricingRequest);
    }

    @SuppressWarnings("unchecked")
    private void applyPricingResult(Quote quote, Map<String, Object> result) {
        quote.setBasePremium(toBigDecimal(result.get("basePremium")));
        quote.setLoadingAmount(toBigDecimal(result.get("loadingAmount")));
        quote.setAddonAmount(toBigDecimal(result.get("addonAmount")));
        quote.setNetPremium(toBigDecimal(result.get("subtotal")));
        quote.setTaxAmount(toBigDecimal(result.get("taxAmount")));
        quote.setTotalPremium(toBigDecimal(result.get("grandTotal")));
        quote.setRequiresUw(Boolean.TRUE.equals(result.get("requiresUnderwriting")));

        String riskLevelStr = (String) result.get("riskLevel");
        if (riskLevelStr != null) {
            try {
                quote.setRiskLevel(Quote.RiskLevel.valueOf(riskLevelStr));
            } catch (IllegalArgumentException ex) {
                log.warn("Unknown risk level from pricing: {}", riskLevelStr);
            }
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(value.toString()); } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private QuoteResponse toResponse(Quote q) {
        List<QuoteResponse.TravelerDetail> travelerDetails = q.getTravelers().stream()
                .map(t -> QuoteResponse.TravelerDetail.builder()
                        .id(t.getId())
                        .fullName(t.getFullName())
                        .dateOfBirth(t.getDateOfBirth())
                        .age(t.getAge())
                        .primary(t.isPrimary())
                        .build())
                .toList();

        return QuoteResponse.builder()
                .id(q.getId())
                .quoteReference(q.getQuoteReference())
                .planId(q.getPlanId())
                .planCode(q.getPlanCode())
                .destinationZoneId(q.getDestinationZoneId())
                .destinationCountryCode(q.getDestinationCountryCode())
                .tripStartDate(q.getTripStartDate())
                .tripEndDate(q.getTripEndDate())
                .tripDurationDays(q.getTripDurationDays())
                .numTravelers(q.getNumTravelers())
                .status(q.getStatus().name())
                .basePremium(q.getBasePremium())
                .loadingAmount(q.getLoadingAmount())
                .addonAmount(q.getAddonAmount())
                .netPremium(q.getNetPremium())
                .taxAmount(q.getTaxAmount())
                .totalPremium(q.getTotalPremium())
                .riskScore(q.getRiskScore())
                .riskLevel(q.getRiskLevel() != null ? q.getRiskLevel().name() : null)
                .requiresUw(q.isRequiresUw())
                .expiresAt(q.getExpiresAt())
                .travelers(travelerDetails)
                .build();
    }
}
