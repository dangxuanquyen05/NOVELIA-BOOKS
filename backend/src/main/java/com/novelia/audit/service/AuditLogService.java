package com.novelia.audit.service;

import com.novelia.audit.dto.AuditLogResponse;
import com.novelia.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogService {

    void log(String performedBy, String action, String entityType, String entityId, String summary, String details);

    void log(String performedBy, String action, String entityType, String entityId, String summary, String details, String ipAddress, String status);

    PageResponse<AuditLogResponse> getAuditLogs(
            String action,
            String entityType,
            String performedBy,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    List<String> getAvailableActions();

    List<String> getAvailableEntityTypes();
}
