package com.novelia.payment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "novelia.payment.vnpay")
public class VNPayProperties {
    private String tmnCode = "NOVELIA1";
    private String hashSecret = "NOVELIASECRETKEYVNPAY2026TESTSANDBOX";
    private String paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private String returnUrl = "http://localhost:5173/payment/vnpay-callback";
    private boolean sandboxMode = true;
    private boolean liveCredentialsConfigured = false;
    private int connectionTimeoutMs = 5000;
    private int readTimeoutMs = 10000;
}
