package com.insurance.policy.repository;

import com.insurance.policy.entity.PolicyAgentBinding;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PolicyAgentBindingRepository extends JpaRepository<PolicyAgentBinding, String> {

    Optional<PolicyAgentBinding> findByPolicyId(String policyId);

    Page<PolicyAgentBinding> findByAgentUserId(String agentUserId, Pageable pageable);

    boolean existsByPolicyId(String policyId);
}
