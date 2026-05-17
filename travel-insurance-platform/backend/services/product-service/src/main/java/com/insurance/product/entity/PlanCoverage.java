package com.insurance.product.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "plan_coverages", schema = "ins_product")
public class PlanCoverage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @Column(name = "coverage_type_id", nullable = false, length = 36)
    private String coverageTypeId;

    @Column(name = "coverage_code", nullable = false, length = 100)
    private String coverageCode;

    @Column(name = "default_limit", nullable = false, precision = 12, scale = 2)
    private BigDecimal defaultLimit;

    @Column(name = "min_limit", precision = 12, scale = 2)
    private BigDecimal minLimit;

    @Column(name = "max_limit", precision = 12, scale = 2)
    private BigDecimal maxLimit;

    @Column(name = "limit_step", precision = 12, scale = 2)
    private BigDecimal limitStep;

    @Column(name = "is_adjustable", nullable = false)
    private boolean adjustable = false;

    @Column(name = "is_included", nullable = false)
    private boolean included = true;

    @Column(name = "deductible", precision = 12, scale = 2)
    private BigDecimal deductible;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
