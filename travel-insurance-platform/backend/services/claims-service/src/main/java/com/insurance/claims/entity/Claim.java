package com.insurance.claims.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "claims", schema = "ins_claims")
@EntityListeners(AuditingEntityListener.class)
public class Claim {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "claim_reference", unique = true, nullable = false, length = 30)
    private String claimReference;

    @Column(name = "policy_id", nullable = false, length = 36)
    private String policyId;

    @Column(name = "policy_number", nullable = false, length = 30)
    private String policyNumber;

    @Column(name = "policy_snapshot_id", nullable = false, length = 36)
    private String policySnapshotId;

    @Column(name = "customer_id", nullable = false, length = 36)
    private String customerId;

    @Column(name = "claim_type_id", nullable = false, length = 36)
    private String claimTypeId;

    @Column(name = "claim_type_code", nullable = false, length = 80)
    private String claimTypeCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private ClaimStatus status = ClaimStatus.SUBMITTED;

    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(name = "incident_description", columnDefinition = "TEXT")
    private String incidentDescription;

    @Column(name = "claimed_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal claimedAmount;

    @Column(name = "approved_amount", precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "assigned_officer_id", length = 36)
    private String assignedOfficerId;

    @Column(name = "sla_due_at")
    private LocalDateTime slaDueAt;

    @Column(name = "decision_reason", columnDefinition = "TEXT")
    private String decisionReason;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decided_by", length = 36)
    private String decidedBy;

    @Column(name = "is_high_value", nullable = false)
    private boolean highValue = false;

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

    public enum ClaimStatus {
        SUBMITTED, DOCUMENT_REVIEW, DOCUMENT_PENDING, UNDER_REVIEW,
        INVESTIGATION_ASSIGNED, INVESTIGATION_COMPLETE, DECISION_PENDING,
        AUTO_APPROVED, AUTO_DECLINED, APPROVED, PARTIALLY_APPROVED,
        DECLINED, PAYMENT_PENDING, SETTLED, CLOSED
    }
}
