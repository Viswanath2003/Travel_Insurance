package com.insurance.rule.repository;

import com.insurance.rule.entity.RuleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleDefinitionRepository extends JpaRepository<RuleDefinition, String> {

    @Query("SELECT r FROM RuleDefinition r JOIN FETCH r.conditionGroups cg JOIN FETCH cg.conditions " +
           "JOIN FETCH r.actions WHERE r.ruleType = :ruleType AND r.active = true ORDER BY r.priority ASC")
    List<RuleDefinition> findActiveByTypeOrderByPriority(RuleDefinition.RuleType ruleType);

    List<RuleDefinition> findByActiveTrue();
}
