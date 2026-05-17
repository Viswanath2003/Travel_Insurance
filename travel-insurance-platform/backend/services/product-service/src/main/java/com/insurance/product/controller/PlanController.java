package com.insurance.product.controller;

import com.insurance.common.dto.ApiResponse;
import com.insurance.common.security.PermissionConstants;
import com.insurance.product.dto.response.PlanDetailResponse;
import com.insurance.product.dto.response.PlanSummaryResponse;
import com.insurance.product.service.PlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plans")
@RequiredArgsConstructor
@Tag(name = "Plans", description = "Insurance plan catalog — marketplace and admin")
public class PlanController {

    private final PlanService planService;

    @GetMapping
    @Operation(summary = "Get all active plans for marketplace")
    public ResponseEntity<ApiResponse<List<PlanSummaryResponse>>> getActivePlans() {
        return ResponseEntity.ok(ApiResponse.ok(planService.getActivePlans()));
    }

    @GetMapping("/{planId}")
    @Operation(summary = "Get full plan details including coverages and add-ons")
    public ResponseEntity<ApiResponse<PlanDetailResponse>> getPlanById(@PathVariable String planId) {
        return ResponseEntity.ok(ApiResponse.ok(planService.getPlanById(planId)));
    }

    @GetMapping("/code/{planCode}")
    @Operation(summary = "Get plan by plan code")
    public ResponseEntity<ApiResponse<PlanDetailResponse>> getPlanByCode(@PathVariable String planCode) {
        return ResponseEntity.ok(ApiResponse.ok(planService.getPlanByCode(planCode)));
    }
}
