package com.insurance.audit.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Immutable audit log — no updated_at, no version, no delete operations.
 * DB user (ins_audit_svc) has INSERT+SELECT only grants enforcing this at DB level.
 */
@Getter
@Setter
@Entity
@Table(name = "audit_logs", schema = "ins_audit")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "actor_id", length = 36)
    private String actorId;

    @Column(name = "actor_username", length = 100)
    private String actorUsername;

    @Column(name = "actor_ip", length = 45)
    private String actorIp;

    @Column(name = "service_name", nullable = false, length = 80)
    private String serviceName;

    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;

    @Column(name = "entity_id", length = 36)
    private String entityId;

    @Column(name = "action", nullable = false, length = 80)
    private String action;

    @Column(name = "outcome", nullable = false, length = 20)
    private String outcome;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "payload_before", columnDefinition = "JSON")
    private String payloadBefore;

    @Column(name = "payload_after", columnDefinition = "JSON")
    private String payloadAfter;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (occurredAt == null) occurredAt = LocalDateTime.now();
    }
}
