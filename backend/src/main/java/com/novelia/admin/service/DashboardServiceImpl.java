package com.novelia.admin.service;

import com.novelia.admin.dto.*;
import com.novelia.book.repository.BookRepository;
import com.novelia.inventory.dto.InventoryResponse;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.order.dto.OrderItemResponse;
import com.novelia.order.dto.OrderResponse;
import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.repository.PaymentRepository;
import com.novelia.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private static final Set<Order.OrderStatus> VALID_REVENUE_STATUSES = Set.of(
            Order.OrderStatus.CONFIRMED,
            Order.OrderStatus.SHIPPING,
            Order.OrderStatus.DELIVERED
    );

    private static final String REVENUE_RULE_DESC = 
            "Doanh thu thực tế được tính từ các đơn hàng hợp lệ (CONFIRMED, SHIPPING, DELIVERED). " +
            "Hoàn toàn loại trừ đơn đã hủy (CANCELLED), đơn hoàn trả (REFUNDED) và đơn mới tạo chưa xác nhận (PENDING).";

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final InventoryRepository inventoryRepository;
    private final PaymentRepository paymentRepository;

    public DashboardServiceImpl(
            OrderRepository orderRepository,
            UserRepository userRepository,
            BookRepository bookRepository,
            InventoryRepository inventoryRepository,
            PaymentRepository paymentRepository
    ) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.inventoryRepository = inventoryRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardStats(int days) {
        return getDashboardStats(days, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardStats(int days, LocalDate startDate, LocalDate endDate) {
        LocalDate curStart;
        LocalDate curEnd;
        int diffDays;

        if (startDate != null && endDate != null && !startDate.isAfter(endDate)) {
            curStart = startDate;
            curEnd = endDate;
            diffDays = (int) java.time.temporal.ChronoUnit.DAYS.between(curStart, curEnd) + 1;
            if (diffDays <= 0) diffDays = 1;
        } else {
            diffDays = (days <= 0 || days > 90) ? 7 : days;
            curEnd = LocalDate.now();
            curStart = curEnd.minusDays(diffDays - 1);
        }

        LocalDateTime startCurrent = curStart.atStartOfDay();
        LocalDateTime endCurrent = curEnd.atTime(23, 59, 59, 999999999);

        LocalDate prevStart = curStart.minusDays(diffDays);
        LocalDate prevEnd = curStart.minusDays(1);
        LocalDateTime startPrev = prevStart.atStartOfDay();
        LocalDateTime endPrev = prevEnd.atTime(23, 59, 59, 999999999);

        // 1. KPI Cards
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue(VALID_REVENUE_STATUSES);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        BigDecimal todayRevenue = orderRepository.calculateRevenueSince(VALID_REVENUE_STATUSES, startOfToday);
        if (todayRevenue == null) todayRevenue = BigDecimal.ZERO;

        BigDecimal periodRevenue = orderRepository.calculateRevenueBetween(VALID_REVENUE_STATUSES, startCurrent, endCurrent);
        if (periodRevenue == null) periodRevenue = BigDecimal.ZERO;

        BigDecimal previousPeriodRevenue = orderRepository.calculateRevenueBetween(VALID_REVENUE_STATUSES, startPrev, endPrev);
        if (previousPeriodRevenue == null) previousPeriodRevenue = BigDecimal.ZERO;

        Double growthRatePercentage = null;
        if (previousPeriodRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthRatePercentage = periodRevenue.subtract(previousPeriodRevenue)
                    .multiply(new BigDecimal("100"))
                    .divide(previousPeriodRevenue, 1, java.math.RoundingMode.HALF_UP)
                    .doubleValue();
        }

        BigDecimal grossOrderValue = orderRepository.calculateGrossOrderValueBetween(startCurrent, endCurrent);
        if (grossOrderValue == null) grossOrderValue = BigDecimal.ZERO;

        long totalOrders = orderRepository.count();
        long periodOrders = orderRepository.countOrdersBetween(startCurrent, endCurrent);
        long validOrdersCount = orderRepository.countValidOrdersBetween(VALID_REVENUE_STATUSES, startCurrent, endCurrent);
        BigDecimal averageOrderValue = validOrdersCount > 0
                ? periodRevenue.divide(BigDecimal.valueOf(validOrdersCount), 0, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Thống kê chi tiết trạng thái đơn trong kỳ (Hủy, Hoàn tiền)
        List<Object[]> statusCounts = orderRepository.countOrdersByStatusBetweenRaw(startCurrent, endCurrent);
        long cancelledOrdersCount = 0;
        long refundedOrdersCount = 0;
        BigDecimal refundedAmount = BigDecimal.ZERO;

        for (Object[] row : statusCounts) {
            Order.OrderStatus st = (Order.OrderStatus) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal amount = (BigDecimal) row[2];
            if (st == Order.OrderStatus.CANCELLED) {
                cancelledOrdersCount = count;
            } else if (st == Order.OrderStatus.REFUNDED) {
                refundedOrdersCount = count;
                refundedAmount = amount != null ? amount : BigDecimal.ZERO;
            }
        }

        long pendingOrdersCount = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long totalCustomers = userRepository.countCustomers();
        long totalBooks = bookRepository.count();
        long lowStockBooksCount = inventoryRepository.countLowStockItems();

        DashboardKpiResponse kpis = DashboardKpiResponse.builder()
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .periodRevenue(periodRevenue)
                .previousPeriodRevenue(previousPeriodRevenue)
                .growthRatePercentage(growthRatePercentage)
                .grossOrderValue(grossOrderValue)
                .averageOrderValue(averageOrderValue)
                .estimatedNetProfit(null) // Không tự ý tính lợi nhuận ròng khi chưa có giá vốn thực
                .totalOrders(totalOrders)
                .periodOrders(periodOrders)
                .validOrdersCount(validOrdersCount)
                .pendingOrdersCount(pendingOrdersCount)
                .cancelledOrdersCount(cancelledOrdersCount)
                .refundedOrdersCount(refundedOrdersCount)
                .refundedAmount(refundedAmount)
                .totalCustomers(totalCustomers)
                .totalBooks(totalBooks)
                .lowStockBooksCount(lowStockBooksCount)
                .revenueRuleDescription(REVENUE_RULE_DESC)
                .build();

        // 2. Xu hướng doanh thu theo ngày
        List<RevenueTrendPoint> revenueTrend = calculateRevenueTrend(curStart, curEnd, diffDays);

        // 3. Cơ cấu trạng thái đơn hàng
        List<OrderStatusDistribution> orderDistribution = calculateOrderDistribution(totalOrders);

        // 4. Cơ cấu doanh thu theo thể loại sách
        List<CategoryRevenueDistribution> categoryDistribution = calculateCategoryDistribution(startCurrent);

        // 5. Top sách bán chạy
        List<TopSellingBookResponse> topSellingBooks = fetchTopSellingBooks();

        // 6. Đơn hàng gần đây
        List<OrderResponse> recentOrders = fetchRecentOrders();

        // 7. Cảnh báo tồn kho thấp
        List<InventoryResponse> lowStockAlerts = fetchLowStockAlerts();

        return DashboardResponse.builder()
                .kpis(kpis)
                .revenueTrend(revenueTrend)
                .orderDistribution(orderDistribution)
                .categoryDistribution(categoryDistribution)
                .topSellingBooks(topSellingBooks)
                .recentOrders(recentOrders)
                .lowStockAlerts(lowStockAlerts)
                .build();
    }

    private List<RevenueTrendPoint> calculateRevenueTrend(LocalDate startDate, LocalDate endDate, int days) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59, 999999999);

        List<Order> validOrders = orderRepository.findValidOrdersSince(VALID_REVENUE_STATUSES, startDateTime);

        // Gom nhóm theo ngày và lọc không vượt quá endDateTime
        Map<LocalDate, List<Order>> ordersByDate = validOrders.stream()
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isAfter(endDateTime))
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate()));

        DateTimeFormatter dateKeyFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("dd/MM");

        List<RevenueTrendPoint> points = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate current = startDate.plusDays(i);
            if (current.isAfter(endDate)) break;

            List<Order> dayOrders = ordersByDate.getOrDefault(current, Collections.emptyList());

            BigDecimal dayRevenue = dayOrders.stream()
                    .map(Order::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            points.add(RevenueTrendPoint.builder()
                    .date(current.format(dateKeyFormatter))
                    .formattedDate(current.format(displayFormatter))
                    .revenue(dayRevenue)
                    .orderCount(dayOrders.size())
                    .build());
        }

        return points;
    }

    private List<CategoryRevenueDistribution> calculateCategoryDistribution(LocalDateTime since) {
        List<Object[]> rawList = orderRepository.findCategoryRevenueDistributionRaw(VALID_REVENUE_STATUSES, since);
        if (rawList == null || rawList.isEmpty()) {
            return Collections.emptyList();
        }

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<Map.Entry<String, BigDecimal>> parsed = new ArrayList<>();

        for (Object[] row : rawList) {
            String name = (String) row[0];
            BigDecimal rev = (row[1] instanceof BigDecimal b) ? b : BigDecimal.ZERO;
            if (rev.compareTo(BigDecimal.ZERO) > 0) {
                parsed.add(Map.entry(name != null ? name : "Chung", rev));
                grandTotal = grandTotal.add(rev);
            }
        }

        if (grandTotal.compareTo(BigDecimal.ZERO) == 0) {
            return Collections.emptyList();
        }

        List<CategoryRevenueDistribution> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : parsed) {
            double percentage = entry.getValue()
                    .multiply(new BigDecimal("100"))
                    .divide(grandTotal, 1, java.math.RoundingMode.HALF_UP)
                    .doubleValue();

            result.add(CategoryRevenueDistribution.builder()
                    .categoryName(entry.getKey())
                    .revenue(entry.getValue())
                    .percentage(percentage)
                    .build());
        }

        return result;
    }

    private List<OrderStatusDistribution> calculateOrderDistribution(long totalOrders) {
        List<Object[]> rawCounts = orderRepository.countOrdersByStatusRaw();
        Map<Order.OrderStatus, Long> countsMap = new EnumMap<>(Order.OrderStatus.class);

        for (Object[] row : rawCounts) {
            if (row[0] instanceof Order.OrderStatus status && row[1] instanceof Number count) {
                countsMap.put(status, count.longValue());
            }
        }

        List<OrderStatusDistribution> distribution = new ArrayList<>();
        for (Order.OrderStatus status : Order.OrderStatus.values()) {
            long count = countsMap.getOrDefault(status, 0L);
            double percentage = (totalOrders > 0)
                    ? Math.round((count * 100.0 / totalOrders) * 10.0) / 10.0
                    : 0.0;

            distribution.add(OrderStatusDistribution.builder()
                    .status(status.name())
                    .label(getOrderStatusLabel(status))
                    .count(count)
                    .percentage(percentage)
                    .build());
        }

        return distribution;
    }

    private List<TopSellingBookResponse> fetchTopSellingBooks() {
        List<Object[]> rawTop = orderRepository.findTopSellingBooksRaw(VALID_REVENUE_STATUSES, PageRequest.of(0, 5));
        List<TopSellingBookResponse> list = new ArrayList<>();

        for (Object[] row : rawTop) {
            Long bookId = (Long) row[0];
            String title = (String) row[1];
            String cover = (String) row[2];
            long sold = (row[3] instanceof Number n) ? n.longValue() : 0L;
            BigDecimal revenue = (row[4] instanceof BigDecimal b) ? b : BigDecimal.ZERO;

            list.add(TopSellingBookResponse.builder()
                    .bookId(bookId)
                    .title(title)
                    .coverImage(cover)
                    .totalSold(sold)
                    .totalRevenue(revenue)
                    .build());
        }

        return list;
    }

    private List<OrderResponse> fetchRecentOrders() {
        List<Order> orders = orderRepository.findTop10ByOrderByCreatedAtDesc();
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    private List<InventoryResponse> fetchLowStockAlerts() {
        List<Inventory> list = inventoryRepository.findTopLowStockItems(PageRequest.of(0, 6));
        return list.stream()
                .map(inv -> {
                    int available = inv.getQuantity() - (inv.getReservedQuantity() != null ? inv.getReservedQuantity() : 0);
                    return InventoryResponse.builder()
                            .id(inv.getId())
                            .bookId(inv.getBook().getId())
                            .bookTitle(inv.getBook().getTitle())
                            .isbn(inv.getBook().getIsbn())
                            .coverImage(inv.getBook().getCoverImage())
                            .quantity(inv.getQuantity())
                            .reservedQuantity(inv.getReservedQuantity())
                            .availableQuantity(available)
                            .lowStockThreshold(inv.getLowStockThreshold())
                            .isLowStock(available <= inv.getLowStockThreshold())
                            .updatedAt(inv.getUpdatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private OrderResponse mapToOrderResponse(Order order) {
        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        String paymentMethod = payment != null ? payment.getPaymentMethod().name() : "COD";
        String paymentStatus = payment != null ? payment.getPaymentStatus().name() : "UNPAID";

        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .bookId(item.getBook() != null ? item.getBook().getId() : null)
                        .bookTitle(item.getBookTitle())
                        .bookCover(item.getBookCover())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private String getOrderStatusLabel(Order.OrderStatus status) {
        return switch (status) {
            case PENDING -> "Chờ xử lý";
            case CONFIRMED -> "Đã xác nhận";
            case SHIPPING -> "Đang giao hàng";
            case DELIVERED -> "Giao thành công";
            case CANCELLED -> "Đã hủy đơn";
            case REFUNDED -> "Đã hoàn tiền";
        };
    }
}
