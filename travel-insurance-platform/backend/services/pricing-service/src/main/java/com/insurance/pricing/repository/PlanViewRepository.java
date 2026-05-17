package com.insurance.pricing.repository;

import com.insurance.pricing.entity.PlanView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PlanViewRepository extends JpaRepository<PlanView, String> {

    @Query("SELECT p FROM PlanView p LEFT JOIN FETCH p.coverages WHERE p.planCode = :planCode AND p.active = true")
    Optional<PlanView> findActivePlanByCode(@Param("planCode") String planCode);
}
