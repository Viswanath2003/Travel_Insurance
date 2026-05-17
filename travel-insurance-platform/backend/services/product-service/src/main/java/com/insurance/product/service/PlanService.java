package com.insurance.product.service;

import com.insurance.product.dto.response.PlanDetailResponse;
import com.insurance.product.dto.response.PlanSummaryResponse;

import java.util.List;

public interface PlanService {

    List<PlanSummaryResponse> getActivePlans();

    PlanDetailResponse getPlanById(String planId);

    PlanDetailResponse getPlanByCode(String planCode);
}
