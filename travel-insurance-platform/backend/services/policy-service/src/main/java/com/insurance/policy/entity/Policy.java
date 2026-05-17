package com.insurance.policy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "policies", schema = "ins_policy")
public class Policy extends BaseEntity {

    @Column(name = "policy_number", unique = true, nullable = false, length = 30)
    private String policyNumber;

    @Column(name = "quote_id", nullable = false, length = 36)
    private String quoteId;

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
    private PolicyStatus status = PolicyStatus.PENDING_PAYMENT;

    @Column(name = "total_premium", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPremium;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Column(name = "issued_at")
    private java.time.LocalDateTime issuedAt;

    @Column(name = "issuance_snapshot_id", length = 36)
    private String issuanceSnapshotId;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    public enum PolicyStatus {
        PENDING_PAYMENT, PENDING_UW, ACTIVE, EXPIRED, CANCELLED, REJECTED, LAPSED
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, VERY_HIGH
    }
}
