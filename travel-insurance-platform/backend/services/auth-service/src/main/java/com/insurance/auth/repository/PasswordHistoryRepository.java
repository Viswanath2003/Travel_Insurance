package com.insurance.auth.repository;

import com.insurance.auth.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, String> {

    List<PasswordHistory> findTop5ByUserIdOrderByChangedAtDesc(String userId);
}
