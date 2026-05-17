package com.insurance.rule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class RuleEvaluationRequest {

    @NotBlank(message = "Rule type is required")
    private String ruleType;

    @NotBlank(message = "Entity ID is required")
    private String entityId;

    @NotBlank(message = "Entity type is required")
    private String entityType;

    @NotNull(message = "Attributes are required")
    private Map<String, Object> attributes = new HashMap<>();
}
