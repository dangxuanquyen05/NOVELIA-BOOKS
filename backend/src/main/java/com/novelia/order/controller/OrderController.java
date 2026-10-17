package com.novelia.order.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.order.dto.CancelOrderRequest;
import com.novelia.order.dto.CheckoutSummaryResponse;
import com.novelia.order.dto.CreateOrderRequest;
import com.novelia.order.dto.OrderResponse;
import com.novelia.order.entity.Order.OrderStatus;
import com.novelia.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@PreAuthorize("isAuthenticated()")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/checkout-summary")
    public ResponseEntity<ApiResponse<CheckoutSummaryResponse>> getCheckoutSummary(Authentication authentication) {
        CheckoutSummaryResponse summary = orderService.getCheckoutSummary(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            Authentication authentication,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse order = orderService.createOrder(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công", order));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByOrderNumber(
            Authentication authentication,
            @PathVariable String orderNumber) {
        OrderResponse order = orderService.getOrderByOrderNumber(authentication.getName(), orderNumber);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            Authentication authentication,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<OrderResponse> orders = orderService.getMyOrders(authentication.getName(), status, page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PutMapping("/{orderNumber}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            Authentication authentication,
            @PathVariable String orderNumber,
            @Valid @RequestBody(required = false) CancelOrderRequest request) {
        OrderResponse order = orderService.cancelOrder(authentication.getName(), orderNumber, request);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công, tồn kho đã được hoàn lại", order));
    }
}
