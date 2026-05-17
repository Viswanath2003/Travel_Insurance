package com.insurance.product.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "plans", schema = "ins_product")
public class Plan extends BaseEntity {

    @Column(name = "product_id", nullable = false, length = 36)
    private String productId;

    @Column(name = "plan_code", unique = true, nullable = false, length = 50)
    private String planCode;

    @Column(name = "plan_name", nullable = false, length = 150)
    private String planName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_premium", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePremium;

    @Column(name = "max_trip_duration_days")
    private Integer maxTripDurationDays;

    @Column(name = "max_travelers")
    private Integer maxTravelers;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "requires_uw", nullable = false)
    private boolean requiresUw = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "current_version", nullable = false)
    private int currentVersion = 1;

    @OneToMany(mappedBy = "plan", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<PlanCoverage> coverages = new HashSet<>();
}
