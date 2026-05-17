package com.insurance.rule.engine;

import com.insurance.rule.entity.RuleCondition;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Slf4j
@Component
public class ConditionEvaluator {

    public boolean evaluate(RuleCondition condition, RuleEvaluationContext context) {
        String fieldName = condition.getFieldName();
        String expectedValue = condition.getFieldValue();
        Object actualValue = context.get(fieldName);
        RuleCondition.ConditionOperator operator = condition.getOperator();

        try {
            return switch (operator) {
                case IS_NULL -> actualValue == null;
                case IS_NOT_NULL -> actualValue != null;
                case EQ -> equalsCheck(actualValue, expectedValue);
                case NEQ -> !equalsCheck(actualValue, expectedValue);
                case GT -> compareNumeric(actualValue, expectedValue) > 0;
                case GTE -> compareNumeric(actualValue, expectedValue) >= 0;
                case LT -> compareNumeric(actualValue, expectedValue) < 0;
                case LTE -> compareNumeric(actualValue, expectedValue) <= 0;
                case IN -> inCheck(actualValue, expectedValue);
                case NOT_IN -> !inCheck(actualValue, expectedValue);
                case BETWEEN -> betweenCheck(actualValue, expectedValue);
                case CONTAINS -> containsCheck(actualValue, expectedValue);
            };
        } catch (Exception e) {
            log.warn("Condition evaluation error for field '{}' operator '{}': {}", fieldName, operator, e.getMessage());
            return false;
        }
    }

    private boolean equalsCheck(Object actual, String expected) {
        if (actual == null) return StringUtils.isEmpty(expected);
        return actual.toString().equalsIgnoreCase(expected);
    }

    private int compareNumeric(Object actual, String expected) {
        double a = toDouble(actual);
        double b = Double.parseDouble(expected.trim());
        return Double.compare(a, b);
    }

    private boolean inCheck(Object actual, String expected) {
        if (actual == null) return false;
        List<String> values = Arrays.asList(expected.split(","));
        return values.stream().map(String::trim).anyMatch(v -> v.equalsIgnoreCase(actual.toString()));
    }

    private boolean betweenCheck(Object actual, String expected) {
        String[] parts = expected.split(",");
        if (parts.length != 2) return false;
        double a = toDouble(actual);
        double low = Double.parseDouble(parts[0].trim());
        double high = Double.parseDouble(parts[1].trim());
        return a >= low && a <= high;
    }

    private boolean containsCheck(Object actual, String expected) {
        if (actual == null) return false;
        return actual.toString().toLowerCase().contains(expected.toLowerCase());
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        return Double.parseDouble(Objects.requireNonNull(value).toString().trim());
    }
}
