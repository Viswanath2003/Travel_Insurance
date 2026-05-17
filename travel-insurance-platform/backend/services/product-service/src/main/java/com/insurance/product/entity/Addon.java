package com.insurance.product.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "addons", schema = "ins_product")
public class Addon extends BaseEntity {

    @Column(name = "addon_code", unique = true, nullable = false, length = 80)
    private String addonCode;

    @Column(name = "addon_name", nullable = false, length = 150)
    private String addonName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "pricing_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private PricingType pricingType;

    @Column(name = "pricing_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricingValue;

    @Column(name = "coverage_type_code", length = 100)
    private String coverageTypeCode;

    @Column(name = "coverage_limit", precision = 12, scale = 2)
    private BigDecimal coverageLimit;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public enum PricingType {
        FLAT, PERCENT_OF_BASE, PER_DAY, PER_TRAVELER
    }
}
