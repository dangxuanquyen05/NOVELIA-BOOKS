package com.novelia.audit.service;

import com.novelia.audit.dto.AuditLogResponse;
import com.novelia.audit.entity.AuditLog;
import com.novelia.audit.repository.AuditLogRepository;
import com.novelia.common.dto.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    private static final Pattern SENSITIVE_KEY_PATTERN = Pattern.compile(
            "(?i)(\"?(password|passwordHash|token|secret|apiKey|authorization|accessToken|refreshToken)\"?\\s*[:=]\\s*\"?)([^\"&,\\s]+)(\"?)");

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String performedBy, String action, String entityType, String entityId, String summary, String details) {
        String clientIp = resolveClientIp();
        log(performedBy, action, entityType, entityId, summary, details, clientIp, "SUCCESS");
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String performedBy, String action, String entityType, String entityId, String summary, String details, String ipAddress, String status) {
        try {
            String sanitizedDetails = sanitize(details);
            String safePerformer = (performedBy != null && !performedBy.trim().isEmpty()) ? performedBy.trim() : "SYSTEM";
            String safeStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : "SUCCESS";
            String safeIp = (ipAddress != null && !ipAddress.trim().isEmpty()) ? ipAddress.trim() : resolveClientIp();

            AuditLog auditLog = AuditLog.builder()
                    .performedBy(safePerformer)
                    .action(action != null ? action.trim().toUpperCase() : "UNKNOWN")
                    .entityType(entityType != null ? entityType.trim().toUpperCase() : "SYSTEM")
                    .entityId(entityId)
                    .summary(summary != null ? summary.trim() : "")
                    .details(sanitizedDetails)
                    .ipAddress(safeIp)
                    .status(safeStatus)
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(auditLog);
            log.info("[AUDIT] Action: {} | Performer: {} | Entity: {}#{} | Status: {}",
                    auditLog.getAction(), auditLog.getPerformedBy(), auditLog.getEntityType(), auditLog.getEntityId(), auditLog.getStatus());
        } catch (Exception ex) {
            log.error("Failed to persist audit log: {}", ex.getMessage(), ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(
            String action,
            String entityType,
            String performedBy,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        String safeAction = (action != null && !action.trim().isEmpty()) ? action.trim().toUpperCase() : null;
        String safeEntity = (entityType != null && !entityType.trim().isEmpty()) ? entityType.trim().toUpperCase() : null;
        String safePerformer = (performedBy != null && !performedBy.trim().isEmpty()) ? performedBy.trim() : null;
        String safeStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        Page<AuditLog> logPage = auditLogRepository.findWithFilter(
                safePerformer, safeAction, safeEntity, safeStatus, startDate, endDate, pageable);

        List<AuditLogResponse> dtoList = logPage.getContent().stream()
                .map(AuditLogResponse::fromEntity)
                .toList();

        return PageResponse.<AuditLogResponse>builder()
                .content(dtoList)
                .pageNumber(logPage.getNumber())
                .pageSize(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .isFirst(logPage.isFirst())
                .isLast(logPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableActions() {
        return auditLogRepository.findDistinctActions();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableEntityTypes() {
        return auditLogRepository.findDistinctEntityTypes();
    }

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }

    private String sanitize(String input) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }
        return SENSITIVE_KEY_PATTERN.matcher(input).replaceAll("$1***REDACTED***$4");
    }
}
