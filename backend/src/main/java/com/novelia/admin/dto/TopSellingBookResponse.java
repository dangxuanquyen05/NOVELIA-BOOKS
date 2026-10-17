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
public class TopSellingBookResponse {
    private Long bookId;
    private String title;
    private String coverImage;
    private long totalSold;
    private BigDecimal totalRevenue;
}
