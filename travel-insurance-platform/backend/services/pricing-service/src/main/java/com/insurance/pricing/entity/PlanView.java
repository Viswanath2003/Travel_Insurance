package com.insurance.pricing.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Getter
@Entity
@Table(name = "plans", schema = "ins_product")
public class PlanView {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "plan_code", length = 50)
    private String planCode;

    @Column(name = "plan_name", length = 150)
    private String planName;

    @Column(name = "base_premium", precision = 12, scale = 2)
    private BigDecimal basePremium;

    @Column(name = "max_trip_duration_days")
    private Integer maxTripDurationDays;

    @Column(name = "max_travelers")
    private Integer maxTravelers;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "is_active")
    private boolean active;

    @Column(name = "requires_uw")
    private boolean requiresUw;

    @OneToMany(mappedBy = "plan", fetch = FetchType.LAZY)
    private Set<PlanCoverageView> coverages = new HashSet<>();
}
