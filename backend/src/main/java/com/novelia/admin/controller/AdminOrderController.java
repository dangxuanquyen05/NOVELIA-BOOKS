package com.novelia.admin.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.order.dto.OrderResponse;
import com.novelia.order.dto.UpdateOrderStatusRequest;
import com.novelia.order.entity.Order.OrderStatus;
import com.novelia.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_STAFF')")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<OrderResponse> orders = orderService.getAllOrdersForAdmin(
                status, keyword, paymentMethod, paymentStatus, startDate, endDate, page, size);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetail(
            Authentication authentication,
            @PathVariable String orderNumber) {
        OrderResponse order = orderService.getOrderByOrderNumber(authentication.getName(), orderNumber);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PutMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            Authentication authentication,
            @PathVariable String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderResponse order = orderService.updateOrderStatusForAdmin(orderNumber, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", order));
    }

    @PutMapping("/{orderNumber}/payment")
    public ResponseEntity<ApiResponse<OrderResponse>> updatePaymentStatus(
            Authentication authentication,
            @PathVariable String orderNumber,
            @Valid @RequestBody com.novelia.order.dto.UpdatePaymentStatusRequest request) {
        OrderResponse order = orderService.updatePaymentStatusForAdmin(orderNumber, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thanh toán thành công", order));
    }
}
