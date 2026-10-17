package com.novelia.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCallbackResult {
    private boolean success;
    private String orderNumber;
    private String transactionCode;
    private BigDecimal amount;
    private String paymentStatus;
    private String responseCode;
    private String message;
    private boolean isDuplicateRetry;
}
