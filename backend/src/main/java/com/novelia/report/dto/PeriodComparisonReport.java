package com.novelia.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodComparisonReport {
    private BigDecimal currentRevenue;
    private BigDecimal previousRevenue;
    private Double revenueGrowthPercentage;
    private BigDecimal revenueVariance;

    private Long currentValidOrders;
    private Long previousValidOrders;
    private Double ordersGrowthPercentage;

    private BigDecimal currentAov;
    private BigDecimal previousAov;
    private Double aovGrowthPercentage;
}
