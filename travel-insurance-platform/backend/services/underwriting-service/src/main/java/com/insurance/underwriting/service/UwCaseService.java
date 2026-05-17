package com.insurance.underwriting.service;

import com.insurance.underwriting.dto.request.UwDecisionRequest;
import com.insurance.underwriting.dto.response.UwCaseResponse;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface UwCaseService {

    UwCaseResponse getCaseById(String caseId);

    UwCaseResponse getCaseByReference(String caseReference);

    UwCaseResponse getCaseByPolicyId(String policyId);

    PagedResponse<UwCaseResponse> getQueue(Pageable pageable);

    PagedResponse<UwCaseResponse> getMyAssignedCases(Pageable pageable);

    UwCaseResponse assignCase(String caseId, String underwriterId);

    UwCaseResponse lockCase(String caseId);

    UwCaseResponse unlockCase(String caseId);

    UwCaseResponse approve(String caseId, UwDecisionRequest request);

    UwCaseResponse approveWithConditions(String caseId, UwDecisionRequest request);

    UwCaseResponse reject(String caseId, UwDecisionRequest request);

    UwCaseResponse referToL2(String caseId, String notes);

    UwCaseResponse escalate(String caseId, String notes);

    UwCaseResponse requestMoreInfo(String caseId, String requestDetails);
}
