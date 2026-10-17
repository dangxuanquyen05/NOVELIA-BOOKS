package com.novelia.admin.controller;

import com.novelia.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTestController {

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("accessGranted", true);
        stats.put("roleVerified", "ROLE_ADMIN");
        stats.put("message", "Chào mừng quản trị viên NOVELIA BOOKS");
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
