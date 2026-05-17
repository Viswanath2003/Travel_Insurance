package com.insurance.audit.service.impl;

import com.insurance.audit.entity.AuditLog;
import com.insurance.audit.repository.AuditLogRepository;
import com.insurance.audit.service.AuditLogService;
import com.insurance.common.audit.AuditEvent;
import com.insurance.common.dto.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public AuditLog record(AuditEvent event) {
        AuditLog log = new AuditLog();
        log.setActorId(event.getActorId());
        log.setActorUsername(event.getActorUsername());
        log.setActorIp(event.getActorIp());
        log.setServiceName(event.getServiceName());
        log.setEntityType(event.getEntityType());
        log.setEntityId(event.getEntityId());
        log.setAction(event.getAction());
        log.setOutcome(event.getOutcome() != null ? event.getOutcome() : "SUCCESS");
        log.setDescription(event.getDescription());
        log.setPayloadBefore(event.getPayloadBefore());
        log.setPayloadAfter(event.getPayloadAfter());
        log.setOccurredAt(event.getOccurredAt() != null
                ? LocalDateTime.ofInstant(event.getOccurredAt(), ZoneOffset.UTC)
                : LocalDateTime.now(ZoneOffset.UTC));
        return auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AuditLog> getLogsByEntity(String entityType, String entityId, Pageable pageable) {
        return PagedResponse.of(auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AuditLog> getLogsByActor(String actorId, Pageable pageable) {
        return PagedResponse.of(auditLogRepository.findByActorId(actorId, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AuditLog> getAllLogs(Pageable pageable) {
        return PagedResponse.of(auditLogRepository.findAll(pageable));
    }
}
