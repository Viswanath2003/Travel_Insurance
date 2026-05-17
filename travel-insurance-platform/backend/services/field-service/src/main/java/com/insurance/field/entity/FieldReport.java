package com.insurance.field.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "field_reports", schema = "ins_field")
public class FieldReport {

    @Id
    @Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
    private String id;

    @Column(name = "assignment_id", unique = true, nullable = false, columnDefinition = "uuid")
    private String assignmentId;

    @Column(name = "claim_id", nullable = false, columnDefinition = "uuid")
    private String claimId;

    @Column(name = "submitted_by", nullable = false, columnDefinition = "uuid")
    private String submittedBy;

    @Column(name = "submitted_by_name", length = 100)
    private String submittedByName;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "location_visited", nullable = false, length = 300)
    private String locationVisited;

    @Column(name = "claimant_present", nullable = false)
    private boolean claimantPresent = false;

    @Column(name = "findings", nullable = false, columnDefinition = "TEXT")
    private String findings;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommendation", nullable = false, length = 40)
    private Recommendation recommendation;

    @Column(name = "recommendation_notes", columnDefinition = "TEXT")
    private String recommendationNotes;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "reviewed_by", columnDefinition = "uuid")
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_outcome", length = 30)
    private String reviewOutcome;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public enum Recommendation {
        APPROVE, PARTIAL_APPROVE, REJECT, FURTHER_INVESTIGATION_NEEDED
    }
}
