package com.insurance.rule.engine;

import com.insurance.rule.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class RuleEngine {

    private final ConditionEvaluator conditionEvaluator;

    public RuleEvaluationResult evaluate(List<RuleDefinition> rules, RuleEvaluationContext context) {
        String batchId = UUID.randomUUID().toString();

        RuleEvaluationResult result = RuleEvaluationResult.builder()
                .executionBatchId(batchId)
                .entityId(context.getEntityId())
                .entityType(context.getEntityType())
                .build();

        for (RuleDefinition rule : rules) {
            if (!rule.isActive()) continue;

            boolean ruleMatched = evaluateConditionGroups(rule, context);

            if (ruleMatched) {
                applyActions(rule, result, batchId);
                if (rule.isStopOnMatch()) {
                    log.debug("Stop-on-match triggered by rule {}", rule.getRuleCode());
                    break;
                }
            } else {
                result.getUnmatchedRules().add(RuleEvaluationResult.RuleMatchEntry.builder()
                        .ruleId(rule.getId())
                        .ruleCode(rule.getRuleCode())
                        .ruleName(rule.getRuleName())
                        .matched(false)
                        .build());
            }
        }

        deriveRiskLevel(result);
        return result;
    }

    private boolean evaluateConditionGroups(RuleDefinition rule, RuleEvaluationContext context) {
        if (rule.getConditionGroups().isEmpty()) return true;

        for (RuleConditionGroup group : rule.getConditionGroups()) {
            boolean groupResult = evaluateGroup(group, context);
            // Groups are AND-ed together across the rule
            if (!groupResult) return false;
        }
        return true;
    }

    private boolean evaluateGroup(RuleConditionGroup group, RuleEvaluationContext context) {
        if (group.getConditions().isEmpty()) return true;

        if (group.getLogicalOperator() == RuleConditionGroup.LogicalOperator.AND) {
            return group.getConditions().stream()
                    .allMatch(c -> conditionEvaluator.evaluate(c, context));
        } else {
            return group.getConditions().stream()
                    .anyMatch(c -> conditionEvaluator.evaluate(c, context));
        }
    }

    private void applyActions(RuleDefinition rule, RuleEvaluationResult result, String batchId) {
        for (RuleAction action : rule.getActions()) {
            BigDecimal value = action.getActionValue() != null ? action.getActionValue() : BigDecimal.ZERO;

            switch (action.getActionType()) {
                case ADD_SCORE ->
                    result.setTotalRiskScore(result.getTotalRiskScore().add(value));
                case SUBTRACT_SCORE ->
                    result.setTotalRiskScore(result.getTotalRiskScore().subtract(value));
                case SET_SCORE ->
                    result.setTotalRiskScore(value);
                case SET_RISK_LEVEL ->
                    result.setDeterminedRiskLevel(action.getActionMetadata());
                case MULTIPLY_PREMIUM ->
                    result.setTotalPremiumLoadingPercent(result.getTotalPremiumLoadingPercent().add(value));
                case ADD_PERCENT ->
                    result.setTotalPremiumLoadingPercent(result.getTotalPremiumLoadingPercent().add(value));
                case SUBTRACT_PERCENT ->
                    result.setTotalPremiumLoadingPercent(result.getTotalPremiumLoadingPercent().subtract(value));
                case ADD_FLAT_AMOUNT ->
                    result.setTotalPremiumFlatAmount(result.getTotalPremiumFlatAmount().add(value));
                case ROUTE_TO_UW ->
                    result.setRouteToUnderwriting(true);
                case BLOCK_ELIGIBILITY -> {
                    result.setEligibilityBlocked(true);
                    result.setEligibilityBlockReason(action.getActionMetadata());
                }
                case AUTO_APPROVE ->
                    result.setAutoApprove(true);
                case AUTO_DECLINE ->
                    result.setAutoDecline(true);
            }
        }

        result.getMatchedRules().add(RuleEvaluationResult.RuleMatchEntry.builder()
                .ruleId(rule.getId())
                .ruleCode(rule.getRuleCode())
                .ruleName(rule.getRuleName())
                .matched(true)
                .build());

        log.debug("Rule matched: {} [{}]", rule.getRuleCode(), rule.getRuleType());
    }

    private void deriveRiskLevel(RuleEvaluationResult result) {
        if (result.getDeterminedRiskLevel() != null) return;
        double score = result.getTotalRiskScore().doubleValue();
        if (score >= 80) result.setDeterminedRiskLevel("VERY_HIGH");
        else if (score >= 60) result.setDeterminedRiskLevel("HIGH");
        else if (score >= 30) result.setDeterminedRiskLevel("MEDIUM");
        else result.setDeterminedRiskLevel("LOW");
    }
}
