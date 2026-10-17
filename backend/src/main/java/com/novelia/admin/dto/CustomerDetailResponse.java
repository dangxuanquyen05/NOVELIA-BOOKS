package com.novelia.admin.dto;

import com.novelia.order.dto.OrderResponse;
import com.novelia.user.dto.AddressResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDetailResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String status;
    private Set<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Tổng quan mua hàng thực tế
    private long totalOrders;
    private long completedOrders;
    private long cancelledOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastOrderDate;

    // Danh sách địa chỉ đã lưu
    private List<AddressResponse> addresses;

    // Lịch sử đơn hàng gần đây
    private List<OrderResponse> recentOrders;
}
