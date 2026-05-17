package com.insurance.policy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "quote_travelers", schema = "ins_policy")
public class QuoteTraveler extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "age", nullable = false)
    private int age;

    @Column(name = "passport_number", length = 30)
    private String passportNumber;

    @Column(name = "nationality_code", length = 3)
    private String nationalityCode;

    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 1;
}
