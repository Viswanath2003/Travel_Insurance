package com.insurance.pricing.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleEvaluationResponse {

    private int totalScore;
    private String riskLevel;
    private boolean blocked;
    private boolean requiresUnderwriting;
    private List<ActionResult> appliedActions;
    private List<String> matchedRuleNames;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionResult {
        private String actionType;
        private BigDecimal value;
        private String label;
        private Map<String, Object> metadata;
    }
}
