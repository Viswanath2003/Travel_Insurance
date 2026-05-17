package com.insurance.policy.repository;

import com.insurance.policy.entity.PolicySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PolicySnapshotRepository extends JpaRepository<PolicySnapshot, String> {

    Optional<PolicySnapshot> findByPolicyIdAndSnapshotType(String policyId, PolicySnapshot.SnapshotType type);
}
