package com.novelia.common.controller;

import com.novelia.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("application", "NOVELIA BOOKS API");
        status.put("version", "1.0.0");
        status.put("environment", "Development");
        status.put("systemTime", LocalDateTime.now());

        return ResponseEntity.ok(ApiResponse.success("Hệ thống NOVELIA BOOKS hoạt động bình thường", status));
    }
}
