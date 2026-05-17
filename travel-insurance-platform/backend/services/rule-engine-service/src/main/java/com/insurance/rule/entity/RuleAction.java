package com.insurance.rule.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "rule_actions", schema = "ins_rule")
public class RuleAction {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private RuleDefinition rule;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private ActionType actionType;

    @Column(name = "action_value", precision = 10, scale = 4)
    private BigDecimal actionValue;

    @Column(name = "action_metadata", length = 500)
    private String actionMetadata;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 1;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public enum ActionType {
        ADD_SCORE, SUBTRACT_SCORE, SET_SCORE,
        MULTIPLY_PREMIUM, ADD_FLAT_AMOUNT, ADD_PERCENT, SUBTRACT_PERCENT,
        SET_RISK_LEVEL, ROUTE_TO_UW,
        BLOCK_ELIGIBILITY,
        AUTO_APPROVE, AUTO_DECLINE
    }
}
