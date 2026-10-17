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
public class PaymentUrlResponse {
    private String paymentUrl;
    private String orderNumber;
    private BigDecimal amount;
    private String paymentMethod;
    private boolean sandboxMode;
    private boolean liveCredentialsConfigured;
    private String integrationNotice;
}
