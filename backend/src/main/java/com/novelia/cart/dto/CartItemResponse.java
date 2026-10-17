package com.novelia.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookSlug;
    private String bookCover;
    private BigDecimal unitPrice;
    private BigDecimal originalPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private Integer stockQuantity;
    private Boolean isAvailable;
}
