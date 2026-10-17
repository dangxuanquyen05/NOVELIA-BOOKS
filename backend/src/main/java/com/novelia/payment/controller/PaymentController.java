package com.novelia.payment.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.payment.dto.PaymentCallbackResult;
import com.novelia.payment.dto.PaymentInitRequest;
import com.novelia.payment.dto.PaymentUrlResponse;
import com.novelia.payment.service.PaymentGatewayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentGatewayService paymentGatewayService;

    public PaymentController(PaymentGatewayService paymentGatewayService) {
        this.paymentGatewayService = paymentGatewayService;
    }

    @PostMapping("/create-url")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> createPaymentUrl(
            @Valid @RequestBody PaymentInitRequest request,
            HttpServletRequest servletRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        String clientIp = servletRequest.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty()) {
            clientIp = servletRequest.getRemoteAddr();
        }

        PaymentUrlResponse response = paymentGatewayService.createPaymentUrl(request, clientIp, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo liên kết thanh toán thành công", response));
    }

    @GetMapping("/vnpay-callback")
    public ResponseEntity<ApiResponse<PaymentCallbackResult>> handleVNPayCallback(
            @RequestParam Map<String, String> queryParams) {
        PaymentCallbackResult result = paymentGatewayService.processCallback(queryParams);
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    @GetMapping("/vnpay-ipn")
    public ResponseEntity<com.novelia.payment.dto.VNPayIpnResponse> handleVNPayIpn(
            @RequestParam Map<String, String> queryParams) {
        com.novelia.payment.dto.VNPayIpnResponse ipnResponse = paymentGatewayService.processIpn(queryParams);
        return ResponseEntity.ok(ipnResponse);
    }

    @PostMapping("/simulate-success/{orderNumber}")
    public ResponseEntity<ApiResponse<PaymentCallbackResult>> simulateSuccess(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentCallbackResult result = paymentGatewayService.simulateTestPaymentSuccess(orderNumber, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }
}
