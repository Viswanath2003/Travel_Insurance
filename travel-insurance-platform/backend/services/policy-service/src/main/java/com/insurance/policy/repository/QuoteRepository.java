package com.insurance.policy.repository;

import com.insurance.policy.entity.Quote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, String>, JpaSpecificationExecutor<Quote> {

    Optional<Quote> findByQuoteReference(String quoteReference);

    Page<Quote> findByCustomerId(String customerId, Pageable pageable);

    @Modifying
    @Query("UPDATE Quote q SET q.status = 'EXPIRED' WHERE q.status = 'READY' AND q.expiresAt < :now")
    int expireQuotes(LocalDateTime now);
}
