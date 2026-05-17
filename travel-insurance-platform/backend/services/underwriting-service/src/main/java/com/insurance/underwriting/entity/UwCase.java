package com.insurance.underwriting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "uw_cases", schema = "ins_underwriting")
@EntityListeners(AuditingEntityListener.class)
public class UwCase {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "case_reference", unique = true, nullable = false, length = 30)
    private String caseReference;

    @Column(name = "policy_id", nullable = false, length = 36)
    private String policyId;

    @Column(name = "policy_number", nullable = false, length = 30)
    private String policyNumber;

    @Column(name = "customer_id", nullable = false, length = 36)
    private String customerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false, length = 30)
    private CaseState currentState = CaseState.NEW;

    @Column(name = "assigned_underwriter_id", length = 36)
    private String assignedUnderwriterId;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "sla_due_at")
    private LocalDateTime slaDueAt;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Column(name = "uw_level", nullable = false)
    private int uwLevel = 1;

    @Column(name = "is_locked", nullable = false)
    private boolean locked = false;

    @Column(name = "locked_by", length = 36)
    private String lockedBy;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "decision_reason", columnDefinition = "TEXT")
    private String decisionReason;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decided_by", length = 36)
    private String decidedBy;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public enum CaseState {
        NEW, ASSIGNED, UNDER_REVIEW, INFO_REQUESTED, INFO_RECEIVED,
        APPROVED, APPROVED_WITH_CONDITIONS, REJECTED, REFERRED_TO_L2, L2_UNDER_REVIEW, ESCALATED, CLOSED
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, VERY_HIGH
    }
}
