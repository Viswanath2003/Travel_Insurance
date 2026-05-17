package com.insurance.policy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "policy_agent_bindings", schema = "ins_policy")
@EntityListeners(AuditingEntityListener.class)
public class PolicyAgentBinding {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "policy_id", length = 36, nullable = false, unique = true)
    private String policyId;

    @Column(name = "agent_user_id", length = 36, nullable = false)
    private String agentUserId;

    @Column(name = "agent_code", length = 30)
    private String agentCode;

    @Column(name = "bound_at", nullable = false)
    private LocalDateTime boundAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void prePersist() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.boundAt == null) this.boundAt = LocalDateTime.now();
    }
}
