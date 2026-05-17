package com.insurance.common.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestTemplate;

@Slf4j
@RequiredArgsConstructor
public class RestAuditPublisher implements AuditPublisher {

    private final RestTemplate restTemplate;
    private final String auditServiceUrl;

    @Override
    public void publish(AuditEvent event) {
        try {
            restTemplate.postForObject(auditServiceUrl + "/api/v1/internal/audit", event, Void.class);
        } catch (Exception e) {
            // Audit failure must never break the calling service
            log.warn("Failed to publish audit event [{}:{}]: {}",
                    event.getEntityType(), event.getAction(), e.getMessage());
        }
    }
}
