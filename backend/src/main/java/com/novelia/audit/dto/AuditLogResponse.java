package com.novelia.audit.dto;

import com.novelia.audit.entity.AuditLog;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long id;
    private String performedBy;
    private String action;
    private String entityType;
    private String entityId;
    private String summary;
    private String details;
    private String ipAddress;
    private String status;
    private LocalDateTime createdAt;

    public static AuditLogResponse fromEntity(AuditLog log) {
        if (log == null) return null;
        return AuditLogResponse.builder()
                .id(log.getId())
                .performedBy(log.getPerformedBy())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .summary(log.getSummary())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .status(log.getStatus())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
