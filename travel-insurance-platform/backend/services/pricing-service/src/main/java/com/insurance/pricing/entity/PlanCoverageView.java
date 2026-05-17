package com.insurance.pricing.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "plan_coverages", schema = "ins_product")
public class PlanCoverageView {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private PlanView plan;

    @Column(name = "coverage_code", length = 80)
    private String coverageCode;

    @Column(name = "default_limit", precision = 12, scale = 2)
    private BigDecimal defaultLimit;

    @Column(name = "min_limit", precision = 12, scale = 2)
    private BigDecimal minLimit;

    @Column(name = "max_limit", precision = 12, scale = 2)
    private BigDecimal maxLimit;

    @Column(name = "limit_step", precision = 12, scale = 2)
    private BigDecimal limitStep;

    @Column(name = "is_adjustable")
    private boolean adjustable;

    @Column(name = "is_included")
    private boolean included;

    @Column(name = "premium_loading_rate", precision = 6, scale = 4)
    private BigDecimal premiumLoadingRate;
}
