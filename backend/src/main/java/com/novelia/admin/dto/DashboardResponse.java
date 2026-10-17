package com.novelia.admin.dto;

import com.novelia.inventory.dto.InventoryResponse;
import com.novelia.order.dto.OrderResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private DashboardKpiResponse kpis;
    private List<RevenueTrendPoint> revenueTrend;
    private List<OrderStatusDistribution> orderDistribution;
    private List<CategoryRevenueDistribution> categoryDistribution;
    private List<TopSellingBookResponse> topSellingBooks;
    private List<OrderResponse> recentOrders;
    private List<InventoryResponse> lowStockAlerts;
}
