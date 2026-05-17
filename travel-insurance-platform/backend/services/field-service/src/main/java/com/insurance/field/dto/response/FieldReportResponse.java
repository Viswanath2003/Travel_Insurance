package com.insurance.field.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class FieldReportResponse {

    private String id;
    private String assignmentId;
    private String claimId;
    private String submittedBy;
    private String submittedByName;
    private LocalDate inspectionDate;
    private String locationVisited;
    private boolean claimantPresent;
    private String findings;
    private String recommendation;
    private String recommendationNotes;
    private LocalDateTime submittedAt;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String reviewOutcome;
}
