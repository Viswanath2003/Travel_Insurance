package com.insurance.rule.service.impl;

import com.insurance.rule.dto.request.RuleEvaluationRequest;
import com.insurance.rule.engine.RuleEngine;
import com.insurance.rule.engine.RuleEvaluationContext;
import com.insurance.rule.engine.RuleEvaluationResult;
import com.insurance.rule.entity.RuleDefinition;
import com.insurance.rule.repository.RuleDefinitionRepository;
import com.insurance.rule.service.RuleExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RuleExecutionServiceImpl implements RuleExecutionService {

    private final RuleDefinitionRepository ruleRepository;
    private final RuleEngine ruleEngine;

    @Override
    @Transactional(readOnly = true)
    public RuleEvaluationResult evaluate(RuleEvaluationRequest request) {
        RuleDefinition.RuleType ruleType = RuleDefinition.RuleType.valueOf(request.getRuleType());
        List<RuleDefinition> rules = loadRulesFromCache(ruleType);

        RuleEvaluationContext context = RuleEvaluationContext.builder()
                .entityId(request.getEntityId())
                .entityType(request.getEntityType())
                .attributes(request.getAttributes())
                .build();

        RuleEvaluationResult result = ruleEngine.evaluate(rules, context);
        log.info("Rule evaluation complete [type={}, entity={}, score={}, level={}, matched={}]",
                ruleType, request.getEntityId(), result.getTotalRiskScore(),
                result.getDeterminedRiskLevel(), result.getMatchedRules().size());
        return result;
    }

    @Cacheable(value = "rules", key = "#ruleType.name()")
    public List<RuleDefinition> loadRulesFromCache(RuleDefinition.RuleType ruleType) {
        return ruleRepository.findActiveByTypeOrderByPriority(ruleType);
    }

    @Override
    @CacheEvict(value = "rules", key = "#ruleType")
    public void invalidateRuleCache(String ruleType) {
        log.info("Rule cache evicted for type: {}", ruleType);
    }
}
