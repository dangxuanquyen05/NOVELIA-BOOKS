package com.novelia.book.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookFilterParams {
    private String keyword;
    private Long categoryId;
    private String categorySlug;
    private Long authorId;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean isFeatured;
    private String status;
    private String sortBy; // newest, price_asc, price_desc, rating, title
    
    @Builder.Default
    private Integer page = 0;
    
    @Builder.Default
    private Integer size = 12;
}
