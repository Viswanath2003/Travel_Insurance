package com.insurance.policy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "policy_snapshots", schema = "ins_policy")
public class PolicySnapshot {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "policy_id", nullable = false, length = 36)
    private String policyId;

    @Column(name = "policy_number", nullable = false, length = 30)
    private String policyNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "snapshot_type", nullable = false, length = 20)
    private SnapshotType snapshotType;

    @Column(name = "snapshot_data", nullable = false, columnDefinition = "JSON")
    private String snapshotData;

    @Column(name = "policy_version", nullable = false)
    private long policyVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by", nullable = false, length = 36)
    private String createdBy;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public enum SnapshotType {
        ISSUANCE, ENDORSEMENT, RENEWAL
    }
}
