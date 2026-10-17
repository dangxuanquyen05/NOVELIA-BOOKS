package com.novelia.audit.controller;

import com.novelia.audit.dto.AuditLogResponse;
import com.novelia.audit.service.AuditLogService;
import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    public AdminAuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        PageResponse<AuditLogResponse> logs = auditLogService.getAuditLogs(
                action, entityType, performedBy, status, startDate, endDate, pageable);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhật ký kiểm toán thành công", logs));
    }

    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableActions() {
        List<String> actions = auditLogService.getAvailableActions();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hành động kiểm toán thành công", actions));
    }

    @GetMapping("/entity-types")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableEntityTypes() {
        List<String> entityTypes = auditLogService.getAvailableEntityTypes();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đối tượng kiểm toán thành công", entityTypes));
    }
}
