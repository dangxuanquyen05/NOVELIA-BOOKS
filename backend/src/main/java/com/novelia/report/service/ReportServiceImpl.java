package com.novelia.report.service;

import com.novelia.common.dto.PageResponse;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.Order.OrderStatus;
import com.novelia.order.repository.OrderRepository;
import com.novelia.report.dto.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private static final List<OrderStatus> VALID_REVENUE_STATUSES = List.of(
            OrderStatus.CONFIRMED,
            OrderStatus.SHIPPING,
            OrderStatus.DELIVERED
    );

    private static final String REVENUE_RULE_NOTE =
            "Doanh thu thực nhận chỉ tính từ các đơn hàng hợp lệ (CONFIRMED, SHIPPING, DELIVERED). Đơn hủy (CANCELLED) và đơn hoàn tiền (REFUNDED) được loại trừ 100%.";

    private static final String PROFIT_RULE_NOTE =
            "Novelia Books không tự suy đoán giá vốn khi chưa có dữ liệu giá nhập (COGS) chính thức trong cơ sở dữ liệu.";

    private final OrderRepository orderRepository;

    public ReportServiceImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    private DateRange resolveDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDate curEnd = (endDate != null) ? endDate : LocalDate.now();
        LocalDate curStart = (startDate != null) ? startDate : curEnd.minusDays(29);

        if (curStart.isAfter(curEnd)) {
            LocalDate temp = curStart;
            curStart = curEnd;
            curEnd = temp;
        }

        int diffDays = (int) ChronoUnit.DAYS.between(curStart, curEnd) + 1;
        if (diffDays <= 0) diffDays = 1;

        LocalDateTime startCurrent = curStart.atStartOfDay();
        LocalDateTime endCurrent = curEnd.atTime(23, 59, 59, 999999999);

        LocalDate prevEnd = curStart.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(diffDays - 1);
        LocalDateTime startPrev = prevStart.atStartOfDay();
        LocalDateTime endPrev = prevEnd.atTime(23, 59, 59, 999999999);

        return new DateRange(curStart, curEnd, diffDays, startCurrent, endCurrent, prevStart, prevEnd, startPrev, endPrev);
    }

    private record DateRange(
            LocalDate curStart,
            LocalDate curEnd,
            int diffDays,
            LocalDateTime startCurrent,
            LocalDateTime endCurrent,
            LocalDate prevStart,
            LocalDate prevEnd,
            LocalDateTime startPrev,
            LocalDateTime endPrev
    ) {}

    @Override
    @Transactional(readOnly = true)
    public BusinessOverviewReport getBusinessOverview(LocalDate startDate, LocalDate endDate) {
        DateRange dr = resolveDateRange(startDate, endDate);

        BigDecimal realizedRevenue = orderRepository.calculateRevenueBetween(VALID_REVENUE_STATUSES, dr.startCurrent(), dr.endCurrent());
        if (realizedRevenue == null) realizedRevenue = BigDecimal.ZERO;

        BigDecimal grossOrderValue = orderRepository.calculateGrossOrderValueBetween(dr.startCurrent(), dr.endCurrent());
        if (grossOrderValue == null) grossOrderValue = BigDecimal.ZERO;

        long totalOrders = orderRepository.countOrdersBetween(dr.startCurrent(), dr.endCurrent());
        long validOrders = orderRepository.countValidOrdersBetween(VALID_REVENUE_STATUSES, dr.startCurrent(), dr.endCurrent());

        BigDecimal pendingRevenue = BigDecimal.ZERO;
        BigDecimal cancelledRevenue = BigDecimal.ZERO;
        long pendingOrders = 0;
        long cancelledOrders = 0;

        List<Object[]> statusCounts = orderRepository.countOrdersByStatusBetweenRaw(dr.startCurrent(), dr.endCurrent());
        for (Object[] row : statusCounts) {
            OrderStatus st = (OrderStatus) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal amount = (BigDecimal) row[2];

            if (st == OrderStatus.PENDING) {
                pendingOrders += count;
                pendingRevenue = pendingRevenue.add(amount != null ? amount : BigDecimal.ZERO);
            } else if (st == OrderStatus.CANCELLED || st == OrderStatus.REFUNDED) {
                cancelledOrders += count;
                cancelledRevenue = cancelledRevenue.add(amount != null ? amount : BigDecimal.ZERO);
            }
        }

        Double cancellationRate = 0.0;
        if (totalOrders > 0) {
            cancellationRate = BigDecimal.valueOf((double) cancelledOrders / totalOrders * 100.0)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
        }

        BigDecimal aov = BigDecimal.ZERO;
        if (validOrders > 0) {
            aov = realizedRevenue.divide(BigDecimal.valueOf(validOrders), 0, RoundingMode.HALF_UP);
        }

        // So sánh cùng kỳ trước
        BigDecimal prevRevenue = orderRepository.calculateRevenueBetween(VALID_REVENUE_STATUSES, dr.startPrev(), dr.endPrev());
        if (prevRevenue == null) prevRevenue = BigDecimal.ZERO;

        Double revenueGrowthPercentage = null;
        if (prevRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenueGrowthPercentage = realizedRevenue.subtract(prevRevenue)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(prevRevenue, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        BigDecimal revenueVariance = realizedRevenue.subtract(prevRevenue);

        long prevValidOrders = orderRepository.countValidOrdersBetween(VALID_REVENUE_STATUSES, dr.startPrev(), dr.endPrev());
        Double ordersGrowthPercentage = null;
        if (prevValidOrders > 0) {
            ordersGrowthPercentage = BigDecimal.valueOf((double) (validOrders - prevValidOrders) / prevValidOrders * 100.0)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
        }

        BigDecimal prevAov = BigDecimal.ZERO;
        if (prevValidOrders > 0) {
            prevAov = prevRevenue.divide(BigDecimal.valueOf(prevValidOrders), 0, RoundingMode.HALF_UP);
        }

        Double aovGrowthPercentage = null;
        if (prevAov.compareTo(BigDecimal.ZERO) > 0) {
            aovGrowthPercentage = aov.subtract(prevAov)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(prevAov, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        PeriodComparisonReport comparison = PeriodComparisonReport.builder()
                .currentRevenue(realizedRevenue)
                .previousRevenue(prevRevenue)
                .revenueGrowthPercentage(revenueGrowthPercentage)
                .revenueVariance(revenueVariance)
                .currentValidOrders(validOrders)
                .previousValidOrders(prevValidOrders)
                .ordersGrowthPercentage(ordersGrowthPercentage)
                .currentAov(aov)
                .previousAov(prevAov)
                .aovGrowthPercentage(aovGrowthPercentage)
                .build();

        return BusinessOverviewReport.builder()
                .startDate(dr.curStart())
                .endDate(dr.curEnd())
                .periodDays(dr.diffDays())
                .realizedRevenue(realizedRevenue)
                .grossOrderValue(grossOrderValue)
                .pendingRevenue(pendingRevenue)
                .cancelledRevenue(cancelledRevenue)
                .totalOrders(totalOrders)
                .validOrders(validOrders)
                .pendingOrders(pendingOrders)
                .cancelledOrders(cancelledOrders)
                .cancellationRate(cancellationRate)
                .averageOrderValue(aov)
                .hasCostPriceConfigured(false)
                .grossProfit(null)
                .profitNote(PROFIT_RULE_NOTE)
                .revenueRuleNote(REVENUE_RULE_NOTE)
                .periodComparison(comparison)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RevenueTrendReportPoint> getRevenueTrend(LocalDate startDate, LocalDate endDate, String groupBy) {
        DateRange dr = resolveDateRange(startDate, endDate);

        List<Order> orders = orderRepository.findAllOrdersBetween(dr.startCurrent(), dr.endCurrent());

        // Phân nhóm theo ngày
        Map<String, List<Order>> groupedOrders = new LinkedHashMap<>();
        LocalDate walker = dr.curStart();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        while (!walker.isAfter(dr.curEnd())) {
            groupedOrders.put(walker.format(fmt), new ArrayList<>());
            walker = walker.plusDays(1);
        }

        for (Order order : orders) {
            String key = order.getCreatedAt().toLocalDate().format(fmt);
            if (groupedOrders.containsKey(key)) {
                groupedOrders.get(key).add(order);
            }
        }

        List<RevenueTrendReportPoint> points = new ArrayList<>();
        DateTimeFormatter displayFmt = DateTimeFormatter.ofPattern("dd/MM");

        for (Map.Entry<String, List<Order>> entry : groupedOrders.entrySet()) {
            LocalDate date = LocalDate.parse(entry.getKey(), fmt);
            List<Order> dayOrders = entry.getValue();

            BigDecimal realizedRev = BigDecimal.ZERO;
            BigDecimal grossVal = BigDecimal.ZERO;
            long validCount = 0;

            for (Order o : dayOrders) {
                grossVal = grossVal.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                if (VALID_REVENUE_STATUSES.contains(o.getStatus())) {
                    realizedRev = realizedRev.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                    validCount++;
                }
            }

            points.add(RevenueTrendReportPoint.builder()
                    .date(entry.getKey())
                    .label(date.format(displayFmt))
                    .realizedRevenue(realizedRev)
                    .grossOrderValue(grossVal)
                    .validOrdersCount(validCount)
                    .totalOrdersCount((long) dayOrders.size())
                    .build());
        }

        return points;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderStatusReportItem> getOrderStatusDistribution(LocalDate startDate, LocalDate endDate) {
        DateRange dr = resolveDateRange(startDate, endDate);

        long totalOrders = orderRepository.countOrdersBetween(dr.startCurrent(), dr.endCurrent());
        BigDecimal totalGross = orderRepository.calculateGrossOrderValueBetween(dr.startCurrent(), dr.endCurrent());
        if (totalGross == null) totalGross = BigDecimal.ZERO;

        List<Object[]> rawCounts = orderRepository.countOrdersByStatusBetweenRaw(dr.startCurrent(), dr.endCurrent());
        Map<OrderStatus, Object[]> rawMap = new EnumMap<>(OrderStatus.class);
        for (Object[] row : rawCounts) {
            rawMap.put((OrderStatus) row[0], row);
        }

        List<OrderStatusReportItem> result = new ArrayList<>();
        for (OrderStatus st : OrderStatus.values()) {
            Object[] row = rawMap.get(st);
            long count = (row != null) ? ((Number) row[1]).longValue() : 0L;
            BigDecimal amount = (row != null && row[2] != null) ? (BigDecimal) row[2] : BigDecimal.ZERO;

            Double countPct = totalOrders > 0
                    ? BigDecimal.valueOf((double) count / totalOrders * 100.0).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            Double amountPct = totalGross.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(BigDecimal.valueOf(100)).divide(totalGross, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            result.add(OrderStatusReportItem.builder()
                    .status(st.name())
                    .statusLabel(getStatusLabel(st))
                    .orderCount(count)
                    .totalAmount(amount)
                    .countPercentage(countPct)
                    .amountPercentage(amountPct)
                    .build());
        }

        return result;
    }

    private String getStatusLabel(OrderStatus st) {
        return switch (st) {
            case PENDING -> "Chờ xác nhận";
            case CONFIRMED -> "Đã xác nhận";
            case SHIPPING -> "Đang giao hàng";
            case DELIVERED -> "Đã giao thành công";
            case CANCELLED -> "Đã hủy";
            case REFUNDED -> "Đã hoàn tiền";
        };
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TopBookReportItem> getTopSellingBooks(LocalDate startDate, LocalDate endDate, String sortBy, int page, int size) {
        DateRange dr = resolveDateRange(startDate, endDate);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        List<Object[]> rows;
        if ("REVENUE".equalsIgnoreCase(sortBy)) {
            rows = orderRepository.findTopSellingBooksByRevenueBetweenRaw(VALID_REVENUE_STATUSES, dr.startCurrent(), dr.endCurrent(), pageable);
        } else {
            rows = orderRepository.findTopSellingBooksByQuantityBetweenRaw(VALID_REVENUE_STATUSES, dr.startCurrent(), dr.endCurrent(), pageable);
        }

        List<TopBookReportItem> items = rows.stream().map(row -> TopBookReportItem.builder()
                .bookId(((Number) row[0]).longValue())
                .bookTitle((String) row[1])
                .coverImage((String) row[2])
                .soldQuantity(((Number) row[3]).longValue())
                .revenue((BigDecimal) row[4])
                .build()
        ).collect(Collectors.toList());

        return PageResponse.<TopBookReportItem>builder()
                .content(items)
                .pageNumber(page)
                .pageSize(size)
                .totalElements((long) items.size())
                .totalPages(1)
                .isFirst(page == 0)
                .isLast(true)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryPerformanceReportItem> getCategoryPerformance(LocalDate startDate, LocalDate endDate) {
        DateRange dr = resolveDateRange(startDate, endDate);

        BigDecimal totalRevenue = orderRepository.calculateRevenueBetween(VALID_REVENUE_STATUSES, dr.startCurrent(), dr.endCurrent());
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        List<Object[]> rows = orderRepository.findCategoryPerformanceBetweenRaw(VALID_REVENUE_STATUSES, dr.startCurrent(), dr.endCurrent());

        List<CategoryPerformanceReportItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            Long catId = ((Number) row[0]).longValue();
            String catName = (String) row[1];
            long itemsCount = ((Number) row[2]).longValue();
            long soldQty = ((Number) row[3]).longValue();
            BigDecimal rev = (BigDecimal) row[4];

            Double pct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? rev.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            items.add(CategoryPerformanceReportItem.builder()
                    .categoryId(catId)
                    .categoryName(catName)
                    .itemsCount(itemsCount)
                    .soldQuantity(soldQty)
                    .revenue(rev)
                    .revenuePercentage(pct)
                    .build());
        }

        return items;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TopCustomerReportItem> getTopCustomers(LocalDate startDate, LocalDate endDate, int page, int size) {
        DateRange dr = resolveDateRange(startDate, endDate);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        List<Object[]> rows = orderRepository.findTopCustomersBetweenRaw(VALID_REVENUE_STATUSES, dr.startCurrent(), dr.endCurrent(), pageable);

        List<TopCustomerReportItem> items = rows.stream().map(row -> TopCustomerReportItem.builder()
                .userId(((Number) row[0]).longValue())
                .fullName((String) row[1])
                .email((String) row[2])
                .phone((String) row[3])
                .completedOrders(((Number) row[4]).longValue())
                .totalSpent((BigDecimal) row[5])
                .lastOrderDate((LocalDateTime) row[6])
                .build()
        ).collect(Collectors.toList());

        return PageResponse.<TopCustomerReportItem>builder()
                .content(items)
                .pageNumber(page)
                .pageSize(size)
                .totalElements((long) items.size())
                .totalPages(1)
                .isFirst(page == 0)
                .isLast(true)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportReportToCsv(String reportType, LocalDate startDate, LocalDate endDate) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // UTF-8 BOM for Microsoft Excel compatibility
        out.write(0xEF);
        out.write(0xBB);
        out.write(0xBF);

        PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8);

        String type = (reportType != null) ? reportType.trim().toUpperCase(Locale.ROOT) : "OVERVIEW";

        switch (type) {
            case "TOP_BOOKS" -> exportTopBooksCsv(writer, startDate, endDate);
            case "DAILY_REVENUE" -> exportDailyRevenueCsv(writer, startDate, endDate);
            case "TOP_CUSTOMERS" -> exportTopCustomersCsv(writer, startDate, endDate);
            case "CATEGORIES" -> exportCategoriesCsv(writer, startDate, endDate);
            case "ORDERS" -> exportOrdersCsv(writer, startDate, endDate);
            default -> exportOverviewCsv(writer, startDate, endDate);
        }

        writer.flush();
        return out.toByteArray();
    }

    private void exportOverviewCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        BusinessOverviewReport report = getBusinessOverview(startDate, endDate);
        writer.println("BÁO CÁO TỔNG QUAN HOẠT ĐỘNG KINH DOANH - NOVELIA BOOKS");
        writer.println(String.format("Khoảng thời gian:;Từ %s đến %s (%d ngày)",
                report.getStartDate(), report.getEndDate(), report.getPeriodDays()));
        writer.println();
        writer.println("Chỉ số;Giá trị;Ghi chú");
        writer.println(String.format("Doanh thu thực nhận;%s đ;Chỉ tính đơn CONFIRMED, SHIPPING, DELIVERED", report.getRealizedRevenue()));
        writer.println(String.format("Tổng giá trị đặt hàng (GMV);%s đ;Bao gồm toàn bộ đơn phát sinh", report.getGrossOrderValue()));
        writer.println(String.format("Doanh thu chờ xử lý (Pending);%s đ;Đơn hàng chờ xác nhận", report.getPendingRevenue()));
        writer.println(String.format("Giá trị đơn hủy/hoàn tiền;%s đ;Đơn hàng bị hủy hoặc hoàn tiền", report.getCancelledRevenue()));
        writer.println(String.format("Tổng số đơn hàng;%d;Toàn bộ đơn phát sinh", report.getTotalOrders()));
        writer.println(String.format("Số đơn hàng hợp lệ;%d;Đơn thực nhận doanh thu", report.getValidOrders()));
        writer.println(String.format("Số đơn bị hủy;%d;Đơn hủy và hoàn lại", report.getCancelledOrders()));
        writer.println(String.format("Tỷ lệ hủy đơn;%.1f%%;Đơn hủy / Tổng đơn", report.getCancellationRate()));
        writer.println(String.format("Giá trị đơn trung bình (AOV);%s đ;Doanh thu thực nhận / Số đơn hợp lệ", report.getAverageOrderValue()));
        writer.println();
        writer.println("Quy tắc doanh thu;" + report.getRevenueRuleNote());
        writer.println("Quy tắc lợi nhuận;" + report.getProfitNote());
    }

    private void exportTopBooksCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        PageResponse<TopBookReportItem> page = getTopSellingBooks(startDate, endDate, "REVENUE", 0, 100);
        writer.println("BÁO CÁO SÁCH BÁN CHẠY NHẤT - NOVELIA BOOKS");
        writer.println(String.format("Kỳ báo cáo:;%s đến %s", startDate, endDate));
        writer.println();
        writer.println("Mã sách;Tựa sách;Số lượng bán;Doanh thu mang lại (VNĐ)");
        for (TopBookReportItem item : page.getContent()) {
            writer.println(String.format("%d;\"%s\";%d;%s",
                    item.getBookId(),
                    item.getBookTitle().replace("\"", "\"\""),
                    item.getSoldQuantity(),
                    item.getRevenue()));
        }
    }

    private void exportDailyRevenueCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        List<RevenueTrendReportPoint> trend = getRevenueTrend(startDate, endDate, "DAY");
        writer.println("BÁO CÁO DOANH THU THEO NGÀY - NOVELIA BOOKS");
        writer.println(String.format("Kỳ báo cáo:;%s đến %s", startDate, endDate));
        writer.println();
        writer.println("Ngày;Doanh thu thực nhận (VNĐ);Tổng giá trị đặt GMV (VNĐ);Số đơn hợp lệ;Tổng số đơn");
        for (RevenueTrendReportPoint point : trend) {
            writer.println(String.format("%s;%s;%s;%d;%d",
                    point.getDate(),
                    point.getRealizedRevenue(),
                    point.getGrossOrderValue(),
                    point.getValidOrdersCount(),
                    point.getTotalOrdersCount()));
        }
    }

    private void exportTopCustomersCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        PageResponse<TopCustomerReportItem> page = getTopCustomers(startDate, endDate, 0, 100);
        writer.println("BÁO CÁO KHÁCH HÀNG THÂN THIẾT (TOP SPENDERS) - NOVELIA BOOKS");
        writer.println(String.format("Kỳ báo cáo:;%s đến %s", startDate, endDate));
        writer.println();
        writer.println("Mã KH;Họ và Tên;Email;Số điện thoại;Số đơn hoàn thành;Tổng chi tiêu (VNĐ)");
        for (TopCustomerReportItem c : page.getContent()) {
            writer.println(String.format("%d;\"%s\";%s;%s;%d;%s",
                    c.getUserId(),
                    (c.getFullName() != null ? c.getFullName().replace("\"", "\"\"") : ""),
                    c.getEmail(),
                    (c.getPhone() != null ? c.getPhone() : ""),
                    c.getCompletedOrders(),
                    c.getTotalSpent()));
        }
    }

    private void exportCategoriesCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        List<CategoryPerformanceReportItem> cats = getCategoryPerformance(startDate, endDate);
        writer.println("BÁO CÁO HIỆU QUẢ KINH DOANH THEO THỂ LOẠI - NOVELIA BOOKS");
        writer.println(String.format("Kỳ báo cáo:;%s đến %s", startDate, endDate));
        writer.println();
        writer.println("Mã thể loại;Tên thể loại;Số đầu sách bán;Số cuốn bán;Doanh thu (VNĐ);Tỷ trọng (%)");
        for (CategoryPerformanceReportItem cat : cats) {
            writer.println(String.format("%d;\"%s\";%d;%d;%s;%.1f%%",
                    cat.getCategoryId(),
                    cat.getCategoryName().replace("\"", "\"\""),
                    cat.getItemsCount(),
                    cat.getSoldQuantity(),
                    cat.getRevenue(),
                    cat.getRevenuePercentage()));
        }
    }

    private void exportOrdersCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        DateRange dr = resolveDateRange(startDate, endDate);
        List<Order> orders = orderRepository.findAllOrdersBetween(dr.startCurrent(), dr.endCurrent());
        writer.println("DANH SÁCH ĐƠN HÀNG KỲ BÁO CÁO - NOVELIA BOOKS");
        writer.println(String.format("Kỳ báo cáo:;%s đến %s (%d đơn)", startDate, endDate, orders.size()));
        writer.println();
        writer.println("Mã đơn hàng;Khách hàng;Số điện thoại;Trạng thái đơn;Ngày tạo;Tổng tiền (VND);Doanh thu thực nhận (VND)");
        for (Order o : orders) {
            boolean isValidRevenue = VALID_REVENUE_STATUSES.contains(o.getStatus());
            BigDecimal realized = isValidRevenue ? o.getTotalAmount() : BigDecimal.ZERO;
            writer.println(String.format("%s;\"%s\";%s;%s;%s;%s;%s",
                    o.getOrderNumber(),
                    (o.getReceiverName() != null ? o.getReceiverName().replace("\"", "\"\"") : (o.getUser() != null ? o.getUser().getFullName() : "")),
                    (o.getReceiverPhone() != null ? o.getReceiverPhone() : ""),
                    o.getStatus().name(),
                    (o.getCreatedAt() != null ? o.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : ""),
                    o.getTotalAmount(),
                    realized));
        }
    }
}
