package com.insurance.rule.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.security.PermissionConstants;
import com.insurance.rule.dto.request.RuleEvaluationRequest;
import com.insurance.rule.engine.RuleEvaluationResult;
import com.insurance.rule.service.RuleExecutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rules")
@RequiredArgsConstructor
@Tag(name = "Rule Engine", description = "Rule evaluation and administration")
public class RuleExecutionController {

    private final RuleExecutionService ruleExecutionService;

    @PostMapping("/evaluate")
    @Operation(summary = "Evaluate rules for given entity and attributes")
    public ResponseEntity<ApiResponse<RuleEvaluationResult>> evaluate(
            @Valid @RequestBody RuleEvaluationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(ruleExecutionService.evaluate(request)));
    }

    @PostMapping("/cache/invalidate/{ruleType}")
    @PreAuthorize("hasAuthority('" + PermissionConstants.RULE_MANAGE + "')")
    @Operation(summary = "Invalidate rule cache for a given type (called on rule publish)")
    public ResponseEntity<ApiResponse<Void>> invalidateCache(@PathVariable String ruleType) {
        ruleExecutionService.invalidateRuleCache(ruleType);
        return ResponseEntity.ok(ApiResponse.ok("Cache invalidated for rule type: " + ruleType));
    }
}
