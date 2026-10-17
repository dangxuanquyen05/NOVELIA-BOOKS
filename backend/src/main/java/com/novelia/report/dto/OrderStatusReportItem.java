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
public class OrderStatusReportItem {
    private String status;
    private String statusLabel;
    private Long orderCount;
    private BigDecimal totalAmount;
    private Double countPercentage;
    private Double amountPercentage;
}
