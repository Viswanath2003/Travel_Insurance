package com.insurance.rule.engine;

import lombok.Builder;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

/**
 * Flat attribute map passed to the rule engine for evaluation.
 * Field names use dot-notation: "traveler.age", "destination.risk_tier".
 */
@Getter
@Builder
public class RuleEvaluationContext {

    private final String entityId;
    private final String entityType;

    @Builder.Default
    private final Map<String, Object> attributes = new HashMap<>();

    public void put(String key, Object value) {
        attributes.put(key, value);
    }

    public Object get(String key) {
        return attributes.get(key);
    }

    public String getString(String key) {
        Object val = attributes.get(key);
        return val != null ? val.toString() : null;
    }

    public Double getDouble(String key) {
        Object val = attributes.get(key);
        if (val == null) return null;
        if (val instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (NumberFormatException e) { return null; }
    }
}
