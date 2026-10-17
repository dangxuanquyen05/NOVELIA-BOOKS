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
public class TopBookReportItem {
    private Long bookId;
    private String bookTitle;
    private String coverImage;
    private Long soldQuantity;
    private BigDecimal revenue;
}
