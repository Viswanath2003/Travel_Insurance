package com.insurance.rule.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "rule_definitions", schema = "ins_rule")
@EntityListeners(AuditingEntityListener.class)
public class RuleDefinition {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "rule_code", unique = true, nullable = false, length = 100)
    private String ruleCode;

    @Column(name = "rule_name", nullable = false, length = 200)
    private String ruleName;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 30)
    private RuleType ruleType;

    @Column(name = "priority", nullable = false)
    private int priority = 100;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "stop_on_match", nullable = false)
    private boolean stopOnMatch = false;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "current_version", nullable = false)
    private int currentVersion = 1;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "rule", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("groupOrder ASC")
    private List<RuleConditionGroup> conditionGroups = new ArrayList<>();

    @OneToMany(mappedBy = "rule", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<RuleAction> actions = new ArrayList<>();

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public enum RuleType {
        RISK_SCORING, PREMIUM_LOADING, ELIGIBILITY, ROUTING, CLAIMS_AUTO_DECISION
    }
}
