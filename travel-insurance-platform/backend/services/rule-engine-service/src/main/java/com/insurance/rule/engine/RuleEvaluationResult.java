package com.insurance.rule.engine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleEvaluationResult {

    private String executionBatchId;
    private String entityId;
    private String entityType;

    @Builder.Default
    private BigDecimal totalRiskScore = BigDecimal.ZERO;

    private String determinedRiskLevel;

    @Builder.Default
    private BigDecimal totalPremiumLoadingPercent = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal totalPremiumFlatAmount = BigDecimal.ZERO;

    private boolean eligibilityBlocked;
    private String eligibilityBlockReason;
    private boolean routeToUnderwriting;
    private boolean autoApprove;
    private boolean autoDecline;

    @Builder.Default
    private List<RuleMatchEntry> matchedRules = new ArrayList<>();

    @Builder.Default
    private List<RuleMatchEntry> unmatchedRules = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RuleMatchEntry {
        private String ruleId;
        private String ruleCode;
        private String ruleName;
        private boolean matched;
        private String actionApplied;
        private BigDecimal contributionValue;
        private String reason;
    }
}
