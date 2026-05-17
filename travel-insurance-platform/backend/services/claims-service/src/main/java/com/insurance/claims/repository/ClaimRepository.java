package com.insurance.claims.repository;

import com.insurance.claims.entity.Claim;
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
public interface ClaimRepository extends JpaRepository<Claim, String>, JpaSpecificationExecutor<Claim> {

    Optional<Claim> findByClaimReference(String claimReference);

    Page<Claim> findByCustomerId(String customerId, Pageable pageable);

    Page<Claim> findByPolicyId(String policyId, Pageable pageable);

    Page<Claim> findByStatusIn(List<Claim.ClaimStatus> statuses, Pageable pageable);

    @Query("SELECT c FROM Claim c WHERE c.status NOT IN ('SETTLED','CLOSED','DECLINED','AUTO_DECLINED') " +
           "AND c.slaDueAt IS NOT NULL AND c.slaDueAt < :now")
    List<Claim> findSlaBreachedClaims(LocalDateTime now);

    Page<Claim> findByAssignedOfficerId(String officerId, Pageable pageable);

    @Query("SELECT c FROM Claim c WHERE c.status NOT IN ('SETTLED','CLOSED','DECLINED','AUTO_DECLINED') ORDER BY c.slaDueAt ASC NULLS LAST")
    Page<Claim> findQueue(Pageable pageable);
}
