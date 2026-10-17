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
public class RevenueTrendReportPoint {
    private String date; // YYYY-MM-DD
    private String label;
    private BigDecimal realizedRevenue;
    private BigDecimal grossOrderValue;
    private Long validOrdersCount;
    private Long totalOrdersCount;
}
