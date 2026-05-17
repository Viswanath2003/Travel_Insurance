package com.insurance.pricing.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleEvaluationRequest {

    private String ruleType;
    private Map<String, Object> facts;
    private String contextReference;
}
