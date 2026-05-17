package com.insurance.field.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FieldAssignmentResponse {

    private String id;
    private String assignmentReference;
    private String claimId;
    private String claimReference;
    private String assignedOfficerId;
    private String assignedOfficerName;
    private String assignedBy;
    private String assignedByName;
    private String assignmentStatus;
    private String priority;
    private String investigationLocation;
    private String investigationType;
    private LocalDateTime dueAt;
    private boolean slaBreached;
    private String notesForOfficer;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
