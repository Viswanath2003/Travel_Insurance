package com.insurance.underwriting.service.impl;

import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.common.exception.ForbiddenException;
import com.insurance.common.security.UserPrincipal;
import com.insurance.underwriting.dto.request.UwDecisionRequest;
import com.insurance.underwriting.dto.response.UwCaseResponse;
import com.insurance.underwriting.entity.UwCase;
import com.insurance.underwriting.entity.UwCase.CaseState;
import com.insurance.underwriting.repository.UwCaseRepository;
import com.insurance.underwriting.service.UwCaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UwCaseServiceImpl implements UwCaseService {

    private final UwCaseRepository uwCaseRepository;

    @Override
    @Transactional(readOnly = true)
    public UwCaseResponse getCaseById(String caseId) {
        return toResponse(findById(caseId));
    }

    @Override
    @Transactional(readOnly = true)
    public UwCaseResponse getCaseByReference(String caseReference) {
        UwCase c = uwCaseRepository.findByCaseReference(caseReference)
                .orElseThrow(() -> new ResourceNotFoundException("UwCase", caseReference));
        return toResponse(c);
    }

    @Override
    @Transactional(readOnly = true)
    public UwCaseResponse getCaseByPolicyId(String policyId) {
        UwCase c = uwCaseRepository.findByPolicyId(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("UwCase for policy", policyId));
        return toResponse(c);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UwCaseResponse> getQueue(Pageable pageable) {
        Page<UwCase> page = uwCaseRepository.findQueue(pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UwCaseResponse> getMyAssignedCases(Pageable pageable) {
        String userId = currentUserId();
        Page<UwCase> page = uwCaseRepository.findByAssignedUnderwriterIdAndCurrentStateNotIn(
                userId, java.util.List.of(CaseState.APPROVED, CaseState.REJECTED, CaseState.CLOSED), pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional
    public UwCaseResponse assignCase(String caseId, String underwriterId) {
        UwCase c = findById(caseId);
        requireState(c, CaseState.NEW, CaseState.ASSIGNED);
        c.setAssignedUnderwriterId(underwriterId);
        c.setAssignedAt(LocalDateTime.now());
        c.setCurrentState(CaseState.ASSIGNED);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse lockCase(String caseId) {
        UwCase c = findById(caseId);
        if (c.isLocked()) {
            throw new BusinessRuleException("Case is already locked by another underwriter");
        }
        String userId = currentUserId();
        c.setLocked(true);
        c.setLockedBy(userId);
        c.setLockedAt(LocalDateTime.now());
        c.setCurrentState(CaseState.UNDER_REVIEW);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse unlockCase(String caseId) {
        UwCase c = findById(caseId);
        String userId = currentUserId();
        if (c.isLocked() && !userId.equals(c.getLockedBy())) {
            throw new ForbiddenException("Case is locked by another underwriter");
        }
        c.setLocked(false);
        c.setLockedBy(null);
        c.setLockedAt(null);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse approve(String caseId, UwDecisionRequest request) {
        UwCase c = findById(caseId);
        requireNotState(c, CaseState.APPROVED, CaseState.REJECTED, CaseState.CLOSED);
        String userId = currentUserId();
        c.setCurrentState(CaseState.APPROVED);
        c.setDecisionReason(request.getReason());
        c.setDecidedAt(LocalDateTime.now());
        c.setDecidedBy(userId);
        c.setLocked(false);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse approveWithConditions(String caseId, UwDecisionRequest request) {
        UwCase c = findById(caseId);
        requireNotState(c, CaseState.APPROVED, CaseState.APPROVED_WITH_CONDITIONS, CaseState.REJECTED, CaseState.CLOSED);
        String userId = currentUserId();
        c.setCurrentState(CaseState.APPROVED_WITH_CONDITIONS);
        c.setDecisionReason(request.getReason());
        c.setDecidedAt(LocalDateTime.now());
        c.setDecidedBy(userId);
        c.setLocked(false);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse reject(String caseId, UwDecisionRequest request) {
        UwCase c = findById(caseId);
        requireNotState(c, CaseState.APPROVED, CaseState.REJECTED, CaseState.CLOSED);
        String userId = currentUserId();
        c.setCurrentState(CaseState.REJECTED);
        c.setDecisionReason(request.getReason());
        c.setDecidedAt(LocalDateTime.now());
        c.setDecidedBy(userId);
        c.setLocked(false);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse referToL2(String caseId, String notes) {
        UwCase c = findById(caseId);
        requireState(c, CaseState.UNDER_REVIEW, CaseState.ASSIGNED);
        c.setCurrentState(CaseState.REFERRED_TO_L2);
        c.setUwLevel(2);
        c.setDecisionReason(notes);
        c.setLocked(false);
        c.setAssignedUnderwriterId(null);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse escalate(String caseId, String notes) {
        UwCase c = findById(caseId);
        c.setCurrentState(CaseState.ESCALATED);
        c.setDecisionReason(notes);
        c.setLocked(false);
        return toResponse(uwCaseRepository.save(c));
    }

    @Override
    @Transactional
    public UwCaseResponse requestMoreInfo(String caseId, String requestDetails) {
        UwCase c = findById(caseId);
        c.setCurrentState(CaseState.INFO_REQUESTED);
        c.setDecisionReason(requestDetails);
        return toResponse(uwCaseRepository.save(c));
    }

    // --- helpers ---

    private UwCase findById(String caseId) {
        return uwCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("UwCase", caseId));
    }

    private void requireState(UwCase c, CaseState... allowed) {
        for (CaseState s : allowed) {
            if (c.getCurrentState() == s) return;
        }
        throw new BusinessRuleException("Operation not allowed in state: " + c.getCurrentState());
    }

    private void requireNotState(UwCase c, CaseState... forbidden) {
        for (CaseState s : forbidden) {
            if (c.getCurrentState() == s) {
                throw new BusinessRuleException("Operation not allowed in state: " + c.getCurrentState());
            }
        }
    }

    private String currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal up) return up.getUserId();
        return principal.toString();
    }

    private UwCaseResponse toResponse(UwCase c) {
        return UwCaseResponse.builder()
                .id(c.getId())
                .caseReference(c.getCaseReference())
                .policyId(c.getPolicyId())
                .policyNumber(c.getPolicyNumber())
                .customerId(c.getCustomerId())
                .currentState(c.getCurrentState().name())
                .assignedUnderwriterId(c.getAssignedUnderwriterId())
                .assignedAt(c.getAssignedAt())
                .slaDueAt(c.getSlaDueAt())
                .riskScore(c.getRiskScore())
                .riskLevel(c.getRiskLevel() != null ? c.getRiskLevel().name() : null)
                .uwLevel(c.getUwLevel())
                .locked(c.isLocked())
                .lockedBy(c.getLockedBy())
                .decisionReason(c.getDecisionReason())
                .decidedAt(c.getDecidedAt())
                .decidedBy(c.getDecidedBy())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
