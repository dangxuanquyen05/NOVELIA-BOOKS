package com.novelia.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String userEmail;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private String couponCode;
    private BigDecimal totalAmount;
    private String status;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String note;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentTransactionCode;
    private LocalDateTime paidAt;
    private Boolean inventoryRestored;
    private List<OrderItemResponse> items;
    private List<OrderStatusHistoryResponse> histories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
