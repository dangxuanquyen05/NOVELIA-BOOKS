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
public class RevenueTrendPoint {
    private String date; // YYYY-MM-DD
    private String formattedDate; // dd/MM
    private BigDecimal revenue;
    private long orderCount;
}
