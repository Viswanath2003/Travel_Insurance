package com.insurance.claims.service;

import com.insurance.claims.dto.request.ClaimDecisionRequest;
import com.insurance.claims.dto.request.SubmitClaimRequest;
import com.insurance.claims.dto.response.ClaimResponse;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface ClaimService {

    ClaimResponse submitClaim(SubmitClaimRequest request);

    ClaimResponse getClaimById(String claimId);

    ClaimResponse getClaimByReference(String claimReference);

    PagedResponse<ClaimResponse> getMyClaimsHistory(Pageable pageable);

    PagedResponse<ClaimResponse> getClaimsQueue(Pageable pageable);

    PagedResponse<ClaimResponse> getMyAssignedClaims(Pageable pageable);

    ClaimResponse assignOfficer(String claimId, String officerId);

    ClaimResponse approve(String claimId, ClaimDecisionRequest request);

    ClaimResponse partialApprove(String claimId, ClaimDecisionRequest request);

    ClaimResponse decline(String claimId, ClaimDecisionRequest request);

    ClaimResponse processPayment(String claimId, String paymentReference);

    void uploadDocument(String claimId, MultipartFile file, String documentName);
}
