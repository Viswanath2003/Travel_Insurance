package com.insurance.field.service.impl;

import com.insurance.common.dto.PagedResponse;
import com.insurance.common.exception.BusinessRuleException;
import com.insurance.common.exception.ResourceNotFoundException;
import com.insurance.common.security.UserPrincipal;
import com.insurance.common.util.ReferenceNumberGenerator;
import com.insurance.field.dto.request.CreateFieldAssignmentRequest;
import com.insurance.field.dto.request.ReassignFieldOfficerRequest;
import com.insurance.field.dto.request.SubmitFieldReportRequest;
import com.insurance.field.dto.response.FieldAssignmentResponse;
import com.insurance.field.dto.response.FieldEvidenceDocumentResponse;
import com.insurance.field.dto.response.FieldReportResponse;
import com.insurance.field.entity.FieldAssignment;
import com.insurance.field.entity.FieldAssignment.AssignmentStatus;
import com.insurance.field.entity.FieldEvidenceDocument;
import com.insurance.field.entity.FieldReport;
import com.insurance.field.repository.FieldAssignmentRepository;
import com.insurance.field.repository.FieldEvidenceDocumentRepository;
import com.insurance.field.repository.FieldReportRepository;
import com.insurance.field.service.FieldAssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FieldAssignmentServiceImpl implements FieldAssignmentService {

    private final FieldAssignmentRepository assignmentRepository;
    private final FieldReportRepository reportRepository;
    private final FieldEvidenceDocumentRepository evidenceRepository;

    @Value("${app.evidence.upload-root:/opt/insurance/storage/field-evidence}")
    private String uploadRoot;

    @Override
    @Transactional
    public FieldAssignmentResponse createAssignment(CreateFieldAssignmentRequest request) {
        FieldAssignment fa = new FieldAssignment();
        fa.setAssignmentReference(ReferenceNumberGenerator.generateFieldAssignmentReference());
        fa.setClaimId(request.getClaimId());
        fa.setClaimReference(request.getClaimReference());
        fa.setAssignedOfficerId(request.getAssignedOfficerId());
        fa.setAssignedOfficerName(request.getAssignedOfficerName());
        fa.setAssignedBy(currentUserId());
        fa.setPriority(request.getPriority());
        fa.setInvestigationLocation(request.getInvestigationLocation());
        fa.setInvestigationType(request.getInvestigationType());
        fa.setDueAt(request.getDueAt());
        fa.setNotesForOfficer(request.getNotesForOfficer());
        fa.setAssignmentStatus(AssignmentStatus.PENDING_START);
        return toResponse(assignmentRepository.save(fa));
    }

    @Override
    @Transactional(readOnly = true)
    public FieldAssignmentResponse getAssignmentById(String assignmentId) {
        return toResponse(findById(assignmentId));
    }

    @Override
    @Transactional(readOnly = true)
    public FieldAssignmentResponse getAssignmentByReference(String assignmentReference) {
        return toResponse(assignmentRepository.findByAssignmentReference(assignmentReference)
                .orElseThrow(() -> new ResourceNotFoundException("FieldAssignment", assignmentReference)));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FieldAssignmentResponse> getMyAssignments(Pageable pageable) {
        String officerId = currentUserId();
        Page<FieldAssignment> page = assignmentRepository.findByAssignedOfficerId(officerId, pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FieldAssignmentResponse> getActiveAssignments(Pageable pageable) {
        String officerId = currentUserId();
        Page<FieldAssignment> page = assignmentRepository.findActiveByOfficer(officerId, pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FieldAssignmentResponse> getOpenAssignmentsQueue(Pageable pageable) {
        Page<FieldAssignment> page = assignmentRepository.findOpenAssignments(pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<FieldAssignmentResponse> getAssignmentsByClaimId(String claimId, Pageable pageable) {
        Page<FieldAssignment> page = assignmentRepository.findByClaimId(claimId, pageable);
        return PagedResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional
    public FieldAssignmentResponse startAssignment(String assignmentId) {
        FieldAssignment fa = findById(assignmentId);
        requireOfficerOwns(fa);
        if (fa.getAssignmentStatus() != AssignmentStatus.PENDING_START) {
            throw new BusinessRuleException("Assignment must be in PENDING_START state to start");
        }
        fa.setAssignmentStatus(AssignmentStatus.IN_PROGRESS);
        return toResponse(assignmentRepository.save(fa));
    }

    @Override
    @Transactional
    public FieldAssignmentResponse reassign(String assignmentId, ReassignFieldOfficerRequest request) {
        FieldAssignment fa = findById(assignmentId);
        if (fa.getAssignmentStatus() == AssignmentStatus.COMPLETED
                || fa.getAssignmentStatus() == AssignmentStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot reassign a " + fa.getAssignmentStatus().name().toLowerCase() + " assignment");
        }
        fa.setAssignedOfficerId(request.getNewOfficerId());
        fa.setAssignedOfficerName(request.getNewOfficerName());
        fa.setAssignmentStatus(AssignmentStatus.PENDING_START);
        if (request.getReason() != null) {
            String notes = fa.getNotesForOfficer() != null
                    ? fa.getNotesForOfficer() + "\nReassign reason: " + request.getReason()
                    : "Reassign reason: " + request.getReason();
            fa.setNotesForOfficer(notes);
        }
        return toResponse(assignmentRepository.save(fa));
    }

    @Override
    @Transactional
    public FieldReportResponse submitReport(String assignmentId, SubmitFieldReportRequest request) {
        FieldAssignment fa = findById(assignmentId);
        requireOfficerOwns(fa);
        if (fa.getAssignmentStatus() != AssignmentStatus.IN_PROGRESS) {
            throw new BusinessRuleException("Assignment must be IN_PROGRESS to submit a report");
        }
        if (reportRepository.existsByAssignmentId(assignmentId)) {
            throw new BusinessRuleException("A report has already been submitted for assignment " + fa.getAssignmentReference());
        }

        FieldReport report = new FieldReport();
        report.setAssignmentId(assignmentId);
        report.setClaimId(fa.getClaimId());
        report.setSubmittedBy(currentUserId());
        report.setInspectionDate(request.getInspectionDate());
        report.setLocationVisited(request.getLocationVisited());
        report.setClaimantPresent(request.isClaimantPresent());
        report.setFindings(request.getFindings());
        report.setRecommendation(request.getRecommendation());
        report.setRecommendationNotes(request.getRecommendationNotes());
        report.setSubmittedAt(LocalDateTime.now());

        FieldReport saved = reportRepository.save(report);

        fa.setAssignmentStatus(AssignmentStatus.REPORT_SUBMITTED);
        assignmentRepository.save(fa);

        log.info("Field report submitted for assignment {}", fa.getAssignmentReference());
        return toReportResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FieldReportResponse getReportByAssignmentId(String assignmentId) {
        FieldReport report = reportRepository.findByAssignmentId(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("FieldReport for assignment", assignmentId));
        return toReportResponse(report);
    }

    @Override
    @Transactional
    public FieldEvidenceDocumentResponse uploadEvidence(String assignmentId, MultipartFile file,
                                                         String documentType, String caption) {
        FieldAssignment fa = findById(assignmentId);
        requireOfficerOwns(fa);
        if (fa.getAssignmentStatus() == AssignmentStatus.COMPLETED
                || fa.getAssignmentStatus() == AssignmentStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot upload evidence for a " + fa.getAssignmentStatus().name().toLowerCase() + " assignment");
        }
        FieldReport report = reportRepository.findByAssignmentId(assignmentId)
                .orElseThrow(() -> new BusinessRuleException("Submit the investigation report before uploading evidence"));

        String savedKey = saveFile(assignmentId, file);

        FieldEvidenceDocument doc = new FieldEvidenceDocument();
        doc.setReportId(report.getId());
        doc.setAssignmentId(assignmentId);
        doc.setDocumentName(file.getOriginalFilename());
        doc.setStorageKey(savedKey);
        doc.setFileSizeBytes(file.getSize());
        doc.setMimeType(file.getContentType());
        doc.setDocumentType(documentType != null ? documentType : "OTHER");
        doc.setCaption(caption);
        doc.setUploadedBy(currentUserId());

        return toEvidenceResponse(evidenceRepository.save(doc));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FieldEvidenceDocumentResponse> getEvidenceByAssignmentId(String assignmentId) {
        findById(assignmentId);
        return evidenceRepository.findByAssignmentId(assignmentId).stream()
                .map(this::toEvidenceResponse).toList();
    }

    // --- helpers ---

    private FieldAssignment findById(String assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("FieldAssignment", assignmentId));
    }

    private void requireOfficerOwns(FieldAssignment fa) {
        String userId = currentUserId();
        if (!fa.getAssignedOfficerId().equals(userId)) {
            throw new BusinessRuleException("Assignment belongs to a different officer");
        }
    }

    private String saveFile(String assignmentId, MultipartFile file) {
        try {
            Path dir = Paths.get(uploadRoot, assignmentId);
            Files.createDirectories(dir);
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path target = dir.resolve(fileName);
            file.transferTo(target);
            return target.toString();
        } catch (IOException e) {
            throw new BusinessRuleException("Failed to save evidence file: " + e.getMessage());
        }
    }

    private String currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal up) return up.getUserId();
        return principal.toString();
    }

    private FieldAssignmentResponse toResponse(FieldAssignment fa) {
        return FieldAssignmentResponse.builder()
                .id(fa.getId())
                .assignmentReference(fa.getAssignmentReference())
                .claimId(fa.getClaimId())
                .claimReference(fa.getClaimReference())
                .assignedOfficerId(fa.getAssignedOfficerId())
                .assignedOfficerName(fa.getAssignedOfficerName())
                .assignedBy(fa.getAssignedBy())
                .assignedByName(fa.getAssignedByName())
                .assignmentStatus(fa.getAssignmentStatus().name())
                .priority(fa.getPriority().name())
                .investigationLocation(fa.getInvestigationLocation())
                .investigationType(fa.getInvestigationType())
                .dueAt(fa.getDueAt())
                .slaBreached(fa.isSlaBreached())
                .notesForOfficer(fa.getNotesForOfficer())
                .createdAt(fa.getCreatedAt())
                .updatedAt(fa.getUpdatedAt())
                .build();
    }

    private FieldReportResponse toReportResponse(FieldReport r) {
        return FieldReportResponse.builder()
                .id(r.getId())
                .assignmentId(r.getAssignmentId())
                .claimId(r.getClaimId())
                .submittedBy(r.getSubmittedBy())
                .submittedByName(r.getSubmittedByName())
                .inspectionDate(r.getInspectionDate())
                .locationVisited(r.getLocationVisited())
                .claimantPresent(r.isClaimantPresent())
                .findings(r.getFindings())
                .recommendation(r.getRecommendation().name())
                .recommendationNotes(r.getRecommendationNotes())
                .submittedAt(r.getSubmittedAt())
                .reviewedBy(r.getReviewedBy())
                .reviewedAt(r.getReviewedAt())
                .reviewOutcome(r.getReviewOutcome())
                .build();
    }

    private FieldEvidenceDocumentResponse toEvidenceResponse(FieldEvidenceDocument d) {
        return FieldEvidenceDocumentResponse.builder()
                .id(d.getId())
                .reportId(d.getReportId())
                .assignmentId(d.getAssignmentId())
                .documentType(d.getDocumentType())
                .documentName(d.getDocumentName())
                .fileSizeBytes(d.getFileSizeBytes())
                .mimeType(d.getMimeType())
                .caption(d.getCaption())
                .uploadedBy(d.getUploadedBy())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
