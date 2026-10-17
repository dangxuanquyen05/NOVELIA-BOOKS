package com.novelia.shipment.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.shipment.dto.ShipmentResponse;
import com.novelia.shipment.service.ShippingCarrierService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShippingCarrierService shippingCarrierService;

    public ShipmentController(ShippingCarrierService shippingCarrierService) {
        this.shippingCarrierService = shippingCarrierService;
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<ShipmentResponse>> getShipmentByOrderId(@PathVariable Long orderId) {
        ShipmentResponse response = shippingCarrierService.getShipmentByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin vận chuyển thành công", response));
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<ApiResponse<ShipmentResponse>> trackShipment(@PathVariable String trackingNumber) {
        ShipmentResponse response = shippingCarrierService.trackShipment(trackingNumber);
        return ResponseEntity.ok(ApiResponse.success("Tra cứu vận đơn thành công", response));
    }

    @PostMapping("/calculate-fee")
    public ResponseEntity<ApiResponse<com.novelia.shipment.dto.ShippingFeeCalculateResponse>> calculateShippingFee(
            @jakarta.validation.Valid @RequestBody com.novelia.shipment.dto.ShippingFeeCalculateRequest request) {
        com.novelia.shipment.dto.ShippingFeeCalculateResponse response = shippingCarrierService.calculateShippingFee(request);
        return ResponseEntity.ok(ApiResponse.success("Tính cước vận chuyển thành công", response));
    }

    @PostMapping("/webhook/ghn")
    public ResponseEntity<ApiResponse<ShipmentResponse>> handleGhnWebhook(
            @RequestBody com.novelia.shipment.dto.GhnWebhookPayload payload,
            @RequestHeader(value = "X-Webhook-Token", required = false) String headerToken,
            @RequestParam(value = "token", required = false) String queryToken) {
        String token = headerToken != null ? headerToken : queryToken;
        ShipmentResponse response = shippingCarrierService.processGhnWebhook(payload, token);
        return ResponseEntity.ok(ApiResponse.success("Xử lý Webhook GHN thành công", response));
    }
}
