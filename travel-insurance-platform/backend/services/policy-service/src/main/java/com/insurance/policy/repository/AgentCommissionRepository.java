package com.insurance.policy.repository;

import com.insurance.policy.entity.AgentCommission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface AgentCommissionRepository extends JpaRepository<AgentCommission, String> {

    Page<AgentCommission> findByAgentUserId(String agentUserId, Pageable pageable);

    Optional<AgentCommission> findByPolicyId(String policyId);

    @Query("SELECT COALESCE(SUM(ac.commissionAmount), 0) FROM AgentCommission ac " +
           "WHERE ac.agentUserId = :agentUserId AND ac.paymentStatus = 'PENDING'")
    BigDecimal sumPendingByAgentUserId(String agentUserId);

    @Query("SELECT COALESCE(SUM(ac.commissionAmount), 0) FROM AgentCommission ac " +
           "WHERE ac.agentUserId = :agentUserId AND ac.paymentStatus = 'PAID'")
    BigDecimal sumPaidByAgentUserId(String agentUserId);
}
