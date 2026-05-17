package com.insurance.rule.service;

import com.insurance.rule.dto.request.RuleEvaluationRequest;
import com.insurance.rule.engine.RuleEvaluationResult;

public interface RuleExecutionService {

    RuleEvaluationResult evaluate(RuleEvaluationRequest request);

    void invalidateRuleCache(String ruleType);
}
