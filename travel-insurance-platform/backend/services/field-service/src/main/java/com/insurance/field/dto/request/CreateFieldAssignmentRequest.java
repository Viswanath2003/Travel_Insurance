package com.insurance.field.dto.request;

import com.insurance.field.entity.FieldAssignment.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateFieldAssignmentRequest {

    @NotBlank
    private String claimId;

    @NotBlank
    private String claimReference;

    @NotBlank
    private String assignedOfficerId;

    private String assignedOfficerName;

    @NotNull
    private Priority priority = Priority.MEDIUM;

    private String investigationLocation;

    private String investigationType;

    @NotNull
    private LocalDateTime dueAt;

    private String notesForOfficer;
}
