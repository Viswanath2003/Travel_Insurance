package com.insurance.pricing.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "addons", schema = "ins_product")
public class AddonView {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "addon_code", length = 80)
    private String addonCode;

    @Column(name = "addon_name", length = 150)
    private String addonName;

    @Column(name = "pricing_type", length = 30)
    private String pricingType;

    @Column(name = "pricing_value", precision = 10, scale = 2)
    private BigDecimal pricingValue;

    @Column(name = "is_active")
    private boolean active;
}
