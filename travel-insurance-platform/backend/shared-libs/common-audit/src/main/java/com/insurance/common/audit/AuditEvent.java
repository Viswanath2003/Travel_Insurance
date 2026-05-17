package com.insurance.common.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEvent {

    private String actorId;
    private String actorUsername;
    private String actorIp;
    private String serviceName;
    private String entityType;
    private String entityId;
    private String action;
    private String outcome;
    private String description;
    private String payloadBefore;
    private String payloadAfter;

    @Builder.Default
    private Instant occurredAt = Instant.now();
}
