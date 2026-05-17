package com.insurance.underwriting.repository;

import com.insurance.underwriting.entity.UwCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UwCaseRepository extends JpaRepository<UwCase, String>, JpaSpecificationExecutor<UwCase> {

    Optional<UwCase> findByCaseReference(String caseReference);

    Optional<UwCase> findByPolicyId(String policyId);

    Page<UwCase> findByAssignedUnderwriterId(String underwriterId, Pageable pageable);

    Page<UwCase> findByCurrentStateIn(List<UwCase.CaseState> states, Pageable pageable);

    Page<UwCase> findByAssignedUnderwriterIdAndCurrentStateNotIn(
            String underwriterId, List<UwCase.CaseState> states, Pageable pageable);

    @Query("SELECT c FROM UwCase c WHERE c.currentState IN ('NEW','ASSIGNED','UNDER_REVIEW','INFO_RECEIVED','REFERRED_TO_L2','L2_UNDER_REVIEW') ORDER BY c.slaDueAt ASC NULLS LAST")
    Page<UwCase> findQueue(Pageable pageable);

    @Query("SELECT c FROM UwCase c WHERE c.currentState NOT IN ('APPROVED','REJECTED','CLOSED') " +
           "AND c.slaDueAt IS NOT NULL AND c.slaDueAt < :now")
    List<UwCase> findSlaBreachedCases(LocalDateTime now);
}
