package com.insurance.audit.service;

import com.insurance.audit.entity.AuditLog;
import com.insurance.common.audit.AuditEvent;
import com.insurance.common.dto.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {

    AuditLog record(AuditEvent event);

    PagedResponse<AuditLog> getLogsByEntity(String entityType, String entityId, Pageable pageable);

    PagedResponse<AuditLog> getLogsByActor(String actorId, Pageable pageable);

    PagedResponse<AuditLog> getAllLogs(Pageable pageable);
}
