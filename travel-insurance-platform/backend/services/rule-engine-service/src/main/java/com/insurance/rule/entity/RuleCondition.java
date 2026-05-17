package com.insurance.rule.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "rule_conditions", schema = "ins_rule")
public class RuleCondition {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private RuleConditionGroup group;

    @Column(name = "field_name", nullable = false, length = 150)
    private String fieldName;

    @Enumerated(EnumType.STRING)
    @Column(name = "operator", nullable = false, length = 20)
    private ConditionOperator operator;

    @Column(name = "field_value", nullable = false, length = 500)
    private String fieldValue;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 1;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public enum ConditionOperator {
        EQ, NEQ, GT, GTE, LT, LTE, IN, NOT_IN, BETWEEN, IS_NULL, IS_NOT_NULL, CONTAINS
    }
}
