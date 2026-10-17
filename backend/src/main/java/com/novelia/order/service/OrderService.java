package com.novelia.order.service;

import com.novelia.common.dto.PageResponse;
import com.novelia.order.dto.CancelOrderRequest;
import com.novelia.order.dto.CheckoutSummaryResponse;
import com.novelia.order.dto.CreateOrderRequest;
import com.novelia.order.dto.OrderResponse;
import com.novelia.order.dto.UpdateOrderStatusRequest;
import com.novelia.order.entity.Order.OrderStatus;

public interface OrderService {
    CheckoutSummaryResponse getCheckoutSummary(String userEmail);
    OrderResponse createOrder(String userEmail, CreateOrderRequest request);
    OrderResponse getOrderByOrderNumber(String userEmail, String orderNumber);
    PageResponse<OrderResponse> getMyOrders(String userEmail, int page, int size);
    PageResponse<OrderResponse> getMyOrders(String userEmail, OrderStatus status, int page, int size);
    OrderResponse cancelOrder(String userEmail, String orderNumber, CancelOrderRequest request);

    // Admin & Staff operations
    PageResponse<OrderResponse> getAllOrdersForAdmin(OrderStatus status, String keyword, int page, int size);
    PageResponse<OrderResponse> getAllOrdersForAdmin(
            OrderStatus status,
            String keyword,
            String paymentMethod,
            String paymentStatus,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate,
            int page,
            int size);
    OrderResponse updateOrderStatusForAdmin(String orderNumber, UpdateOrderStatusRequest request, String adminEmail);
    OrderResponse updatePaymentStatusForAdmin(String orderNumber, com.novelia.order.dto.UpdatePaymentStatusRequest request, String adminEmail);
}
