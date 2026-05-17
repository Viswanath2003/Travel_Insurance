package com.insurance.pricing.repository;

import com.insurance.pricing.entity.AddonView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddonViewRepository extends JpaRepository<AddonView, String> {

    List<AddonView> findByAddonCodeInAndActiveTrue(List<String> addonCodes);
}
