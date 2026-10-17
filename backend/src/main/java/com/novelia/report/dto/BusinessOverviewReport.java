package com.novelia.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessOverviewReport {
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer periodDays;

    // Doanh thu thực nhận vs Tổng giá trị đặt hàng
    private BigDecimal realizedRevenue;
    private BigDecimal grossOrderValue;
    private BigDecimal pendingRevenue;
    private BigDecimal cancelledRevenue;

    // Số đơn hàng và tỷ lệ
    private Long totalOrders;
    private Long validOrders;
    private Long pendingOrders;
    private Long cancelledOrders;
    private Double cancellationRate;
    private BigDecimal averageOrderValue; // AOV

    // Lợi nhuận gộp (Không suy đoán giá vốn nếu chưa có dữ liệu)
    private Boolean hasCostPriceConfigured;
    private BigDecimal grossProfit;
    private String profitNote;
    private String revenueRuleNote;

    // So sánh cùng kỳ trước
    private PeriodComparisonReport periodComparison;
}
