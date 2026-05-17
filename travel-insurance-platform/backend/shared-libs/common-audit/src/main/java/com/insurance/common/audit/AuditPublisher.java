package com.insurance.common.audit;

public interface AuditPublisher {

    /**
     * Fire-and-forget: POST audit event to audit-service.
     * Never throws — silently logs on failure to prevent disrupting the main flow.
     */
    void publish(AuditEvent event);
}
