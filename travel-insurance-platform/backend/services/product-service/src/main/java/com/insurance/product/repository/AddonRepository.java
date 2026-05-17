package com.insurance.product.repository;

import com.insurance.product.entity.Addon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddonRepository extends JpaRepository<Addon, String> {

    List<Addon> findByActiveTrue();

    List<Addon> findByIdIn(List<String> ids);
}
