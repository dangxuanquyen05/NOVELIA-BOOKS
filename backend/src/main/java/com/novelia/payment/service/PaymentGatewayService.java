package com.novelia.payment.service;

import com.novelia.payment.dto.PaymentCallbackResult;
import com.novelia.payment.dto.PaymentInitRequest;
import com.novelia.payment.dto.PaymentUrlResponse;

import java.util.Map;

public interface PaymentGatewayService {
    PaymentUrlResponse createPaymentUrl(PaymentInitRequest request, String clientIp, String userEmail);
    PaymentCallbackResult processCallback(Map<String, String> queryParams);
    PaymentCallbackResult simulateTestPaymentSuccess(String orderNumber, String userEmail);
    com.novelia.payment.dto.VNPayIpnResponse processIpn(Map<String, String> queryParams);
}
