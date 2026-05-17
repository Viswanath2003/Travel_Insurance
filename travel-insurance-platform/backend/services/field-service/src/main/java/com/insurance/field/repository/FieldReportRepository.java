package com.insurance.field.repository;

import com.insurance.field.entity.FieldReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FieldReportRepository extends JpaRepository<FieldReport, String> {

    Optional<FieldReport> findByAssignmentId(String assignmentId);

    boolean existsByAssignmentId(String assignmentId);
}
