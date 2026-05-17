package com.insurance.policy.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.dto.PagedResponse;
import com.insurance.common.security.SecurityUtils;
import com.insurance.policy.entity.AgentCommission;
import com.insurance.policy.repository.AgentCommissionRepository;
import com.insurance.policy.repository.PolicyAgentBindingRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/agent/commissions")
@RequiredArgsConstructor
@Tag(name = "Agent Commissions", description = "Agent commission dashboard and payout management")
@SecurityRequirement(name = "bearerAuth")
public class AgentCommissionController {

    private final AgentCommissionRepository commissionRepository;
    private final PolicyAgentBindingRepository bindingRepository;

    @GetMapping
    @PreAuthorize("hasRole('ROLE_AGENT')")
    @Operation(summary = "Get own commission history with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<AgentCommission>>> getMyCommissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String agentId = SecurityUtils.getCurrentUserId();
        Page<AgentCommission> result = commissionRepository.findByAgentUserId(
                agentId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ROLE_AGENT')")
    @Operation(summary = "Get commission summary (pending + paid totals)")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getSummary() {
        String agentId = SecurityUtils.getCurrentUserId();
        BigDecimal pending = commissionRepository.sumPendingByAgentUserId(agentId);
        BigDecimal paid = commissionRepository.sumPaidByAgentUserId(agentId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "pendingAmount", pending,
                "paidAmount", paid,
                "totalEarned", pending.add(paid)
        )));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ROLE_FINANCE')")
    @Operation(summary = "List all agent commissions (finance only)")
    public ResponseEntity<ApiResponse<PagedResponse<AgentCommission>>> getAllCommissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AgentCommission> result = commissionRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }
}
