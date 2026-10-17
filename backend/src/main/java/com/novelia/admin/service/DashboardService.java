package com.novelia.admin.service;

import com.novelia.admin.dto.DashboardResponse;
import java.time.LocalDate;

public interface DashboardService {
    /**
     * Lấy toàn bộ số liệu thống kê tổng quan của Admin Dashboard
     * @param days Số ngày lấy biểu đồ xu hướng doanh thu (mặc định 7 hoặc 14, 30, 90)
     * @return DashboardResponse bao gồm KPIs, xu hướng doanh thu, cơ cấu đơn hàng, sách bán chạy, cảnh báo kho
     */
    DashboardResponse getDashboardStats(int days);

    /**
     * Lấy toàn bộ số liệu thống kê tổng quan theo khoảng thời gian tùy chọn
     * @param days Số ngày (khi không truyền startDate/endDate)
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return DashboardResponse
     */
    DashboardResponse getDashboardStats(int days, LocalDate startDate, LocalDate endDate);
}
