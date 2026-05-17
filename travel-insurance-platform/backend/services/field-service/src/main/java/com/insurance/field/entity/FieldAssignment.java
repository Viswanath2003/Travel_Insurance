package com.insurance.field.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "field_assignments", schema = "ins_field")
@EntityListeners(AuditingEntityListener.class)
public class FieldAssignment {

    @Id
    @Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
    private String id;

    @Column(name = "assignment_reference", unique = true, nullable = false, length = 30)
    private String assignmentReference;

    @Column(name = "claim_id", nullable = false, columnDefinition = "uuid")
    private String claimId;

    @Column(name = "claim_reference", nullable = false, length = 30)
    private String claimReference;

    @Column(name = "assigned_officer_id", nullable = false, columnDefinition = "uuid")
    private String assignedOfficerId;

    @Column(name = "assigned_officer_name", length = 100)
    private String assignedOfficerName;

    @Column(name = "assigned_by", nullable = false, columnDefinition = "uuid")
    private String assignedBy;

    @Column(name = "assigned_by_name", length = 100)
    private String assignedByName;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_status", nullable = false, length = 30)
    private AssignmentStatus assignmentStatus = AssignmentStatus.PENDING_START;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    private Priority priority = Priority.MEDIUM;

    @Column(name = "investigation_location", length = 300)
    private String investigationLocation;

    @Column(name = "investigation_type", length = 60)
    private String investigationType;

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    @Column(name = "sla_breached", nullable = false)
    private boolean slaBreached = false;

    @Column(name = "notes_for_officer", columnDefinition = "TEXT")
    private String notesForOfficer;

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

    public enum AssignmentStatus {
        PENDING_START, IN_PROGRESS, REPORT_SUBMITTED, COMPLETED, CANCELLED
    }

    public enum Priority {
        LOW, MEDIUM, HIGH
    }
}
