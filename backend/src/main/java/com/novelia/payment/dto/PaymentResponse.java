package com.novelia.payment.dto;

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
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private String paymentMethod;
    private String paymentStatus;
    private String transactionCode;
    private BigDecimal amount;
    private LocalDateTime paidAt;
    private String note;
    private LocalDateTime createdAt;
}
