package com.insurance.policy.service;

import com.insurance.policy.dto.response.PolicyResponse;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface PolicyService {

    PolicyResponse issuePolicyFromQuote(String quoteId);

    PolicyResponse getPolicyById(String policyId);

    PolicyResponse getPolicyByNumber(String policyNumber);

    PagedResponse<PolicyResponse> getMyPolicies(Pageable pageable);

    PagedResponse<PolicyResponse> getAllPolicies(Pageable pageable);

    void activatePolicy(String policyId);

    void rejectPolicy(String policyId, String reason);

    void cancelPolicy(String policyId, String reason);
}
