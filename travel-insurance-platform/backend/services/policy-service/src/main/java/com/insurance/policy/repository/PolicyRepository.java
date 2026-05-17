package com.insurance.policy.repository;

import com.insurance.policy.entity.Policy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, String>, JpaSpecificationExecutor<Policy> {

    Optional<Policy> findByPolicyNumber(String policyNumber);

    Page<Policy> findByCustomerId(String customerId, Pageable pageable);

    @Query("SELECT p FROM Policy p WHERE p.status = 'ACTIVE' AND p.tripEndDate < :today")
    List<Policy> findExpiredActivePolicies(LocalDate today);

    @Query("SELECT p FROM Policy p WHERE p.status = 'ACTIVE' " +
           "AND p.tripEndDate BETWEEN :today AND :notifyDate")
    List<Policy> findPoliciesDueForRenewalNotification(LocalDate today, LocalDate notifyDate);
}
