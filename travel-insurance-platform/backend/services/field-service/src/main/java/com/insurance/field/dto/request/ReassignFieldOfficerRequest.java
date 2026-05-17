package com.insurance.field.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReassignFieldOfficerRequest {

    @NotBlank
    private String newOfficerId;

    private String newOfficerName;

    private String reason;
}
