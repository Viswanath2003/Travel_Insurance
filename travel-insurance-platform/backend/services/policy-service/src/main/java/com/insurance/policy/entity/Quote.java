package com.insurance.policy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "quotes", schema = "ins_policy")
public class Quote extends BaseEntity {

    @Column(name = "quote_reference", unique = true, nullable = false, length = 30)
    private String quoteReference;

    @Column(name = "customer_id", nullable = false, length = 36)
    private String customerId;

    @Column(name = "plan_id", nullable = false, length = 36)
    private String planId;

    @Column(name = "plan_code", nullable = false, length = 50)
    private String planCode;

    @Column(name = "destination_zone_id", nullable = false, length = 36)
    private String destinationZoneId;

    @Column(name = "destination_country_code", length = 3)
    private String destinationCountryCode;

    @Column(name = "trip_start_date", nullable = false)
    private LocalDate tripStartDate;

    @Column(name = "trip_end_date", nullable = false)
    private LocalDate tripEndDate;

    @Column(name = "trip_duration_days", nullable = false)
    private int tripDurationDays;

    @Column(name = "num_travelers", nullable = false)
    private int numTravelers;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private QuoteStatus status = QuoteStatus.DRAFT;

    @Column(name = "base_premium", precision = 12, scale = 2)
    private BigDecimal basePremium;

    @Column(name = "loading_percent", precision = 6, scale = 2)
    private BigDecimal loadingPercent;

    @Column(name = "loading_amount", precision = 12, scale = 2)
    private BigDecimal loadingAmount;

    @Column(name = "addon_amount", precision = 12, scale = 2)
    private BigDecimal addonAmount;

    @Column(name = "net_premium", precision = 12, scale = 2)
    private BigDecimal netPremium;

    @Column(name = "tax_percent", precision = 5, scale = 2)
    private BigDecimal taxPercent;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_premium", precision = 12, scale = 2)
    private BigDecimal totalPremium;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Column(name = "requires_uw", nullable = false)
    private boolean requiresUw = false;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuoteTraveler> travelers = new ArrayList<>();

    public enum QuoteStatus {
        DRAFT, READY, EXPIRED, CONVERTED
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, VERY_HIGH
    }
}
