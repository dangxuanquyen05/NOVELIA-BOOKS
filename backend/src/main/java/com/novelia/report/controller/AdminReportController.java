package com.novelia.report.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.report.dto.*;
import com.novelia.report.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_STAFF')")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<BusinessOverviewReport>> getBusinessOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        BusinessOverviewReport report = reportService.getBusinessOverview(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<ApiResponse<List<RevenueTrendReportPoint>>> getRevenueTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "DAY") String groupBy) {
        List<RevenueTrendReportPoint> points = reportService.getRevenueTrend(startDate, endDate, groupBy);
        return ResponseEntity.ok(ApiResponse.success(points));
    }

    @GetMapping("/order-status")
    public ResponseEntity<ApiResponse<List<OrderStatusReportItem>>> getOrderStatusDistribution(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<OrderStatusReportItem> distribution = reportService.getOrderStatusDistribution(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(distribution));
    }

    @GetMapping("/top-books")
    public ResponseEntity<ApiResponse<PageResponse<TopBookReportItem>>> getTopSellingBooks(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "QUANTITY") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<TopBookReportItem> response = reportService.getTopSellingBooks(startDate, endDate, sortBy, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryPerformanceReportItem>>> getCategoryPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CategoryPerformanceReportItem> items = reportService.getCategoryPerformance(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/top-customers")
    public ResponseEntity<ApiResponse<PageResponse<TopCustomerReportItem>>> getTopCustomers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<TopCustomerReportItem> response = reportService.getTopCustomers(startDate, endDate, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/export-csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportReportCsv(
            @RequestParam(defaultValue = "OVERVIEW") String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        byte[] csvData = reportService.exportReportToCsv(reportType, startDate, endDate);

        String filename = String.format("novelia_report_%s_%s.csv",
                reportType.toLowerCase(),
                LocalDate.now());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
