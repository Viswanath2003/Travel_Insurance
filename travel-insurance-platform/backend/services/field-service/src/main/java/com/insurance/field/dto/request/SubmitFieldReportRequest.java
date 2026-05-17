package com.insurance.field.dto.request;

import com.insurance.field.entity.FieldReport.Recommendation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SubmitFieldReportRequest {

    @NotNull
    private LocalDate inspectionDate;

    @NotBlank
    private String locationVisited;

    private boolean claimantPresent = false;

    @NotBlank
    private String findings;

    @NotNull
    private Recommendation recommendation;

    private String recommendationNotes;
}
