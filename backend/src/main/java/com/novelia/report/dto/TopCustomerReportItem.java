package com.novelia.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCustomerReportItem {
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private Long completedOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastOrderDate;
}
