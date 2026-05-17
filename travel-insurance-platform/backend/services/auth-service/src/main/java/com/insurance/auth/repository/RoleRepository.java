package com.insurance.auth.repository;

import com.insurance.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {

    Optional<Role> findByRoleCode(String roleCode);

    Set<Role> findByRoleCodeIn(Set<String> roleCodes);
}
