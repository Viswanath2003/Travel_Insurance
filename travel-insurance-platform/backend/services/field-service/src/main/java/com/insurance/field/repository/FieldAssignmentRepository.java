package com.insurance.field.repository;

import com.insurance.field.entity.FieldAssignment;
import com.insurance.field.entity.FieldAssignment.AssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FieldAssignmentRepository extends JpaRepository<FieldAssignment, String> {

    Optional<FieldAssignment> findByAssignmentReference(String assignmentReference);

    Page<FieldAssignment> findByAssignedOfficerId(String officerId, Pageable pageable);

    Page<FieldAssignment> findByClaimId(String claimId, Pageable pageable);

    @Query("SELECT fa FROM FieldAssignment fa WHERE fa.assignmentStatus NOT IN ('COMPLETED', 'CANCELLED')")
    Page<FieldAssignment> findOpenAssignments(Pageable pageable);

    @Query("SELECT fa FROM FieldAssignment fa WHERE fa.assignedOfficerId = :officerId AND fa.assignmentStatus IN ('PENDING_START', 'IN_PROGRESS', 'REPORT_SUBMITTED')")
    Page<FieldAssignment> findActiveByOfficer(@Param("officerId") String officerId, Pageable pageable);

    boolean existsByClaimIdAndAssignmentStatusNotIn(String claimId, java.util.List<AssignmentStatus> excludedStatuses);
}
