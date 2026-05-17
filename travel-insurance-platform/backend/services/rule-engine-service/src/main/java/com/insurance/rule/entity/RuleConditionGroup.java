package com.insurance.rule.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "rule_condition_groups", schema = "ins_rule")
public class RuleConditionGroup {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private RuleDefinition rule;

    @Enumerated(EnumType.STRING)
    @Column(name = "logical_operator", nullable = false, length = 3)
    private LogicalOperator logicalOperator = LogicalOperator.AND;

    @Column(name = "group_order", nullable = false)
    private int groupOrder = 1;

    @OneToMany(mappedBy = "group", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<RuleCondition> conditions = new ArrayList<>();

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public enum LogicalOperator {
        AND, OR
    }
}
