package com.novelia.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKpiResponse {
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal periodRevenue;
    private BigDecimal previousPeriodRevenue;
    private Double growthRatePercentage;
    private BigDecimal grossOrderValue;
    private BigDecimal estimatedNetProfit;
    private long totalOrders;
    private long periodOrders;
    private long pendingOrdersCount;
    private long totalCustomers;
    private long totalBooks;
    private long lowStockBooksCount;
    private String revenueRuleDescription;
}
