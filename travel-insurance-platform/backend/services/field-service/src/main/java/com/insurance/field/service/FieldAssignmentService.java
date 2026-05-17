package com.insurance.field.service;

import com.insurance.common.dto.PagedResponse;
import com.insurance.field.dto.request.CreateFieldAssignmentRequest;
import com.insurance.field.dto.request.ReassignFieldOfficerRequest;
import com.insurance.field.dto.request.SubmitFieldReportRequest;
import com.insurance.field.dto.response.FieldAssignmentResponse;
import com.insurance.field.dto.response.FieldEvidenceDocumentResponse;
import com.insurance.field.dto.response.FieldReportResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FieldAssignmentService {

    FieldAssignmentResponse createAssignment(CreateFieldAssignmentRequest request);

    FieldAssignmentResponse getAssignmentById(String assignmentId);

    FieldAssignmentResponse getAssignmentByReference(String assignmentReference);

    PagedResponse<FieldAssignmentResponse> getMyAssignments(Pageable pageable);

    PagedResponse<FieldAssignmentResponse> getActiveAssignments(Pageable pageable);

    PagedResponse<FieldAssignmentResponse> getOpenAssignmentsQueue(Pageable pageable);

    PagedResponse<FieldAssignmentResponse> getAssignmentsByClaimId(String claimId, Pageable pageable);

    FieldAssignmentResponse startAssignment(String assignmentId);

    FieldAssignmentResponse reassign(String assignmentId, ReassignFieldOfficerRequest request);

    FieldReportResponse submitReport(String assignmentId, SubmitFieldReportRequest request);

    FieldReportResponse getReportByAssignmentId(String assignmentId);

    FieldEvidenceDocumentResponse uploadEvidence(String assignmentId, MultipartFile file,
                                                  String documentType, String caption);

    List<FieldEvidenceDocumentResponse> getEvidenceByAssignmentId(String assignmentId);
}
