package com.insurance.field.repository;

import com.insurance.field.entity.FieldEvidenceDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FieldEvidenceDocumentRepository extends JpaRepository<FieldEvidenceDocument, String> {

    List<FieldEvidenceDocument> findByReportId(String reportId);

    List<FieldEvidenceDocument> findByAssignmentId(String assignmentId);

    long countByReportId(String reportId);
}
