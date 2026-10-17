package com.novelia.report.service;

import com.novelia.common.dto.PageResponse;
import com.novelia.report.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    BusinessOverviewReport getBusinessOverview(LocalDate startDate, LocalDate endDate);

    List<RevenueTrendReportPoint> getRevenueTrend(LocalDate startDate, LocalDate endDate, String groupBy);

    List<OrderStatusReportItem> getOrderStatusDistribution(LocalDate startDate, LocalDate endDate);

    PageResponse<TopBookReportItem> getTopSellingBooks(LocalDate startDate, LocalDate endDate, String sortBy, int page, int size);

    List<CategoryPerformanceReportItem> getCategoryPerformance(LocalDate startDate, LocalDate endDate);

    PageResponse<TopCustomerReportItem> getTopCustomers(LocalDate startDate, LocalDate endDate, int page, int size);

    byte[] exportReportToCsv(String reportType, LocalDate startDate, LocalDate endDate);
}
