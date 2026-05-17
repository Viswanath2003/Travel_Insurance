package com.insurance.claims.service.impl;

import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.security.UserPrincipal;
import com.insurance.common.util.ReferenceNumberGenerator;
import com.insurance.claims.dto.request.ClaimDecisionRequest;
import com.insurance.claims.dto.request.SubmitClaimRequest;
import com.insurance.claims.dto.response.ClaimResponse;
import com.insurance.claims.entity.Claim;
import com.insurance.claims.entity.Claim.ClaimStatus;
import com.insurance.claims.entity.ClaimDocument;
import com.insurance.claims.repository.ClaimRepository;
import com.insurance.claims.service.ClaimService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;

    @Override
    @Transactional
    public ClaimResponse submitClaim(SubmitClaimRequest request) {
        Claim claim = new Claim();
        claim.setClaimReference(ReferenceNumberGenerator.generateClaimReference());
        claim.setPolicyId(request.getPolicyId());
        claim.setPolicyNumber(request.getPolicyNumber());
        claim.setPolicySnapshotId(request.getPolicySnapshotId());
        claim.setCustomerId(currentUserId());
        claim.setClaimTypeId(request.getClaimTypeId());
        claim.setClaimTypeCode(request.getClaimTypeCode());
        claim.setIncidentDate(request.getIncidentDate());
        claim.setIncidentDescription(request.getIncidentDescription());
        claim.setClaimedAmount(request.getClaimedAmount());
        claim.setStatus(ClaimStatus.SUBMITTED);
        return toResponse(claimRepository.save(claim));
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimResponse getClaimById(String claimId) {
        return toResponse(findById(claimId));
    }

    @Override
    @Transactional(readOnly = true)
    public ClaimResponse getClaimByReference(String claimReference) {
        Claim c = claimRepository.findByClaimReference(claimReference)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", claimReference));
        return toResponse(c);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ClaimResponse> getMyClaimsHistory(Pageable pageable) {
        String userId = currentUserId();
        Page<Claim> page = claimRepository.findByCustomerId(userId, pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ClaimResponse> getClaimsQueue(Pageable pageable) {
        Page<Claim> page = claimRepository.findQueue(pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ClaimResponse> getMyAssignedClaims(Pageable pageable) {
        String userId = currentUserId();
        Page<Claim> page = claimRepository.findByAssignedOfficerId(userId, pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional
    public ClaimResponse assignOfficer(String claimId, String officerId) {
        Claim c = findById(claimId);
        c.setAssignedOfficerId(officerId);
        c.setStatus(ClaimStatus.UNDER_REVIEW);
        return toResponse(claimRepository.save(c));
    }

    @Override
    @Transactional
    public ClaimResponse approve(String claimId, ClaimDecisionRequest request) {
        Claim c = findById(claimId);
        requireNotTerminal(c);
        String userId = currentUserId();
        c.setStatus(ClaimStatus.APPROVED);
        c.setApprovedAmount(request.getApprovedAmount());
        c.setDecisionReason(request.getReason());
        c.setDecidedAt(LocalDateTime.now());
        c.setDecidedBy(userId);
        return toResponse(claimRepository.save(c));
    }

    @Override
    @Transactional
    public ClaimResponse partialApprove(String claimId, ClaimDecisionRequest request) {
        Claim c = findById(claimId);
        requireNotTerminal(c);
        String userId = currentUserId();
        c.setStatus(ClaimStatus.PARTIALLY_APPROVED);
        c.setApprovedAmount(request.getApprovedAmount());
        c.setDecisionReason(request.getReason());
        c.setDecidedAt(LocalDateTime.now());
        c.setDecidedBy(userId);
        return toResponse(claimRepository.save(c));
    }

    @Override
    @Transactional
    public ClaimResponse decline(String claimId, ClaimDecisionRequest request) {
        Claim c = findById(claimId);
        requireNotTerminal(c);
        String userId = currentUserId();
        c.setStatus(ClaimStatus.DECLINED);
        c.setDecisionReason(request.getReason());
        c.setDecidedAt(LocalDateTime.now());
        c.setDecidedBy(userId);
        return toResponse(claimRepository.save(c));
    }

    @Override
    @Transactional
    public ClaimResponse processPayment(String claimId, String paymentReference) {
        Claim c = findById(claimId);
        if (c.getStatus() != ClaimStatus.APPROVED && c.getStatus() != ClaimStatus.PARTIALLY_APPROVED) {
            throw new BusinessRuleException("Claim must be approved before payment");
        }
        c.setStatus(ClaimStatus.SETTLED);
        log.info("Claim {} settled with payment reference {}", c.getClaimReference(), paymentReference);
        return toResponse(claimRepository.save(c));
    }

    @Override
    @Transactional
    public void uploadDocument(String claimId, MultipartFile file, String documentName) {
        Claim c = findById(claimId);
        ClaimDocument doc = new ClaimDocument();
        doc.setClaimId(c.getId());
        doc.setDocumentName(documentName);
        doc.setFileName(file.getOriginalFilename());
        doc.setFileSizeBytes(file.getSize());
        doc.setUploadedBy(currentUserId());
        log.info("Document {} attached to claim {}", documentName, c.getClaimReference());
    }

    // --- helpers ---

    private Claim findById(String claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", claimId));
    }

    private void requireNotTerminal(Claim c) {
        if (c.getStatus() == ClaimStatus.SETTLED || c.getStatus() == ClaimStatus.CLOSED
                || c.getStatus() == ClaimStatus.DECLINED) {
            throw new BusinessRuleException("Operation not allowed in state: " + c.getStatus());
        }
    }

    private String currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal up) return up.getUserId();
        return principal.toString();
    }

    private ClaimResponse toResponse(Claim c) {
        return ClaimResponse.builder()
                .id(c.getId())
                .claimReference(c.getClaimReference())
                .policyId(c.getPolicyId())
                .policyNumber(c.getPolicyNumber())
                .customerId(c.getCustomerId())
                .claimTypeCode(c.getClaimTypeCode())
                .status(c.getStatus().name())
                .incidentDate(c.getIncidentDate())
                .incidentDescription(c.getIncidentDescription())
                .claimedAmount(c.getClaimedAmount())
                .approvedAmount(c.getApprovedAmount())
                .assignedOfficerId(c.getAssignedOfficerId())
                .slaDueAt(c.getSlaDueAt())
                .decisionReason(c.getDecisionReason())
                .decidedAt(c.getDecidedAt())
                .decidedBy(c.getDecidedBy())
                .highValue(c.isHighValue())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
