package com.insurance.product.repository;

import com.insurance.product.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, String>, JpaSpecificationExecutor<Plan> {

    List<Plan> findByActiveTrue();

    Optional<Plan> findByPlanCode(String planCode);

    @Query("SELECT p FROM Plan p JOIN FETCH p.coverages WHERE p.id = :planId AND p.active = true")
    Optional<Plan> findByIdWithCoverages(String planId);

    List<Plan> findByProductIdAndActiveTrue(String productId);
}
