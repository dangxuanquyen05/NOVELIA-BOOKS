package com.novelia;

import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.OrderItem;
import com.novelia.order.repository.OrderItemRepository;
import com.novelia.order.repository.OrderRepository;
import com.novelia.security.JwtTokenProvider;
import com.novelia.user.entity.Role;
import com.novelia.user.entity.User;
import com.novelia.user.repository.RoleRepository;
import com.novelia.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReportManagementApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private BookRepository bookRepository;
    @Autowired private AuthorRepository authorRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;

    private User admin;
    private User staff;
    private User customer1;
    private User customer2;

    private String adminJwt;
    private String staffJwt;
    private String customerJwt;

    private Book book1;
    private Book book2;
    private Category catLiterature;
    private Category catScience;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));
        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Staff").build()));
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        admin = userRepository.save(User.builder()
                .email("report_admin_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Admin Báo Cáo")
                .phone("0981000111")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build());

        staff = userRepository.save(User.builder()
                .email("report_staff_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Staff Báo Cáo")
                .phone("0982000222")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(staffRole)))
                .build());

        customer1 = userRepository.save(User.builder()
                .email("report_cust1_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Khách Hàng VIP")
                .phone("0983000333")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build());

        customer2 = userRepository.save(User.builder()
                .email("report_cust2_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Khách Hàng Thường")
                .phone("0984000444")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build());

        UsernamePasswordAuthenticationToken authAdmin = new UsernamePasswordAuthenticationToken(
                admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        adminJwt = tokenProvider.generateTokenFromUsername(admin.getEmail(), authAdmin);

        UsernamePasswordAuthenticationToken authStaff = new UsernamePasswordAuthenticationToken(
                staff.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        staffJwt = tokenProvider.generateTokenFromUsername(staff.getEmail(), authStaff);

        UsernamePasswordAuthenticationToken authCustomer = new UsernamePasswordAuthenticationToken(
                customer1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        customerJwt = tokenProvider.generateTokenFromUsername(customer1.getEmail(), authCustomer);

        Author author = authorRepository.save(Author.builder()
                .name("Tác Giả Kiểm Thử " + UUID.randomUUID().toString().substring(0, 5))
                .slug("tac-gia-" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        catLiterature = categoryRepository.save(Category.builder()
                .name("Văn Học " + UUID.randomUUID().toString().substring(0, 5))
                .slug("van-hoc-" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        catScience = categoryRepository.save(Category.builder()
                .name("Khoa Học " + UUID.randomUUID().toString().substring(0, 5))
                .slug("khoa-hoc-" + UUID.randomUUID().toString().substring(0, 5))
                .build());

        book1 = bookRepository.save(Book.builder()
                .title("Nhà Giả Kim Test")
                .slug("nha-gia-kim-" + UUID.randomUUID())
                .isbn("978" + (System.currentTimeMillis() % 10000000000L))
                .originalPrice(new BigDecimal("120000"))
                .salePrice(new BigDecimal("100000"))
                .status(Book.BookStatus.PUBLISHED)
                .categories(Set.of(catLiterature))
                .authors(Set.of(author))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(book1)
                .quantity(100)
                .reservedQuantity(0)
                .lowStockThreshold(10)
                .build());

        book2 = bookRepository.save(Book.builder()
                .title("Vũ Trụ Trong Vỏ Hạt Dẻ Test")
                .slug("vu-tru-trong-vo-hat-de-" + UUID.randomUUID())
                .isbn("978" + ((System.currentTimeMillis() + 1) % 10000000000L))
                .originalPrice(new BigDecimal("180000"))
                .salePrice(new BigDecimal("150000"))
                .status(Book.BookStatus.PUBLISHED)
                .categories(Set.of(catScience))
                .authors(Set.of(author))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(book2)
                .quantity(50)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build());
    }

    private Order createTestOrder(User user, Order.OrderStatus status,
                                 BigDecimal total, LocalDateTime createdAt, List<OrderItem> items) {
        Order order = Order.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .user(user)
                .status(status)
                .subtotal(total)
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(total)
                .receiverName(user.getFullName())
                .receiverPhone(user.getPhone())
                .shippingAddress("123 Đường Báo Cáo, Q1, TP.HCM")
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .items(new ArrayList<>())
                .build();

        Order savedOrder = orderRepository.save(order);

        if (items != null) {
            for (OrderItem item : items) {
                item.setOrder(savedOrder);
                orderItemRepository.save(item);
                savedOrder.getItems().add(item);
            }
        }
        return savedOrder;
    }

    @Test
    @DisplayName("Quy tắc doanh thu: Chỉ tính đơn hợp lệ (CONFIRMED/SHIPPING/DELIVERED), không cộng CANCELLED/PENDING")
    void testOverviewMetricsCalculation_StrictRevenueRules() throws Exception {
        LocalDate today = LocalDate.now();
        LocalDateTime now = today.atTime(12, 0);

        // 1. Đơn DELIVERED (Hợp lệ) = 200,000 VND
        OrderItem item1 = OrderItem.builder()
                .book(book1)
                .bookTitle(book1.getTitle())
                .price(book1.getSalePrice())
                .quantity(2)
                .totalPrice(new BigDecimal("200000"))
                .build();
        createTestOrder(customer1, Order.OrderStatus.DELIVERED,
                new BigDecimal("200000"), now.minusHours(2), List.of(item1));

        // 2. Đơn CONFIRMED (Hợp lệ) = 150,000 VND
        OrderItem item2 = OrderItem.builder()
                .book(book2)
                .bookTitle(book2.getTitle())
                .price(book2.getSalePrice())
                .quantity(1)
                .totalPrice(new BigDecimal("150000"))
                .build();
        createTestOrder(customer2, Order.OrderStatus.CONFIRMED,
                new BigDecimal("150000"), now.minusHours(1), List.of(item2));

        // 3. Đơn CANCELLED = 300,000 VND (Không được tính vào doanh thu thực nhận!)
        createTestOrder(customer1, Order.OrderStatus.CANCELLED,
                new BigDecimal("300000"), now.minusHours(3), null);

        // 4. Đơn REFUNDED = 100,000 VND (Không được tính vào doanh thu thực nhận!)
        createTestOrder(customer2, Order.OrderStatus.REFUNDED,
                new BigDecimal("100000"), now.minusHours(4), null);

        // 5. Đơn PENDING = 50,000 VND (Chưa xác nhận -> pendingRevenue, không phải realizedRevenue)
        createTestOrder(customer1, Order.OrderStatus.PENDING,
                new BigDecimal("50000"), now.minusMinutes(30), null);

        mockMvc.perform(get("/api/admin/reports/overview")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.realizedRevenue").value(350000.0)) // 200k + 150k
                .andExpect(jsonPath("$.data.pendingRevenue").value(50000.0))
                .andExpect(jsonPath("$.data.cancelledRevenue").value(400000.0)) // 300k + 100k
                .andExpect(jsonPath("$.data.totalOrders").value(5))
                .andExpect(jsonPath("$.data.validOrders").value(2))
                .andExpect(jsonPath("$.data.cancelledOrders").value(2))
                .andExpect(jsonPath("$.data.cancellationRate").value(40.0)) // 2/5 * 100%
                .andExpect(jsonPath("$.data.averageOrderValue").value(175000)) // 350,000 / 2
                .andExpect(jsonPath("$.data.hasCostPriceConfigured").value(false))
                .andExpect(jsonPath("$.data.grossProfit").doesNotExist())
                .andExpect(jsonPath("$.data.profitNote", containsString("không tự suy đoán giá vốn")));
    }

    @Test
    @DisplayName("Xử lý kỳ không có dữ liệu: An toàn, không lỗi chia cho 0, trả về 0 giá trị mặc định")
    void testEmptyDataPeriodHandling() throws Exception {
        // Khoảng ngày trong quá khứ không có đơn
        mockMvc.perform(get("/api/admin/reports/overview")
                        .param("startDate", "2015-01-01")
                        .param("endDate", "2015-01-02")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.realizedRevenue").value(0))
                .andExpect(jsonPath("$.data.totalOrders").value(0))
                .andExpect(jsonPath("$.data.validOrders").value(0))
                .andExpect(jsonPath("$.data.cancellationRate").value(0.0))
                .andExpect(jsonPath("$.data.averageOrderValue").value(0));
    }

    @Test
    @DisplayName("So sánh kỳ hiện tại với kỳ trước theo cùng quy tắc trong overview")
    void testPeriodComparison() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        // Đơn hôm nay (Kỳ này) = 200,000 VND
        createTestOrder(customer1, Order.OrderStatus.DELIVERED,
                new BigDecimal("200000"), now, null);

        // Đơn hôm qua (Kỳ trước) = 100,000 VND
        createTestOrder(customer1, Order.OrderStatus.DELIVERED,
                new BigDecimal("100000"), now.minusDays(1), null);

        mockMvc.perform(get("/api/admin/reports/overview")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.periodComparison.currentRevenue").value(200000.0))
                .andExpect(jsonPath("$.data.periodComparison.previousRevenue").value(100000.0))
                .andExpect(jsonPath("$.data.periodComparison.revenueVariance").value(100000.0))
                .andExpect(jsonPath("$.data.periodComparison.revenueGrowthPercentage").value(100.0)) // Tăng 100%
                .andExpect(jsonPath("$.data.periodComparison.currentValidOrders").value(1))
                .andExpect(jsonPath("$.data.periodComparison.previousValidOrders").value(1));
    }

    @Test
    @DisplayName("Thống kê trạng thái đơn hàng đầy đủ các trạng thái trong khoảng ngày")
    void testOrderStatusDistribution() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        createTestOrder(customer1, Order.OrderStatus.CONFIRMED,
                new BigDecimal("100000"), now, null);
        createTestOrder(customer2, Order.OrderStatus.DELIVERED,
                new BigDecimal("150000"), now, null);

        mockMvc.perform(get("/api/admin/reports/order-status")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", isA(List.class)))
                .andExpect(jsonPath("$.data[?(@.status == 'CONFIRMED')].orderCount").value(hasItem(1)))
                .andExpect(jsonPath("$.data[?(@.status == 'DELIVERED')].orderCount").value(hasItem(1)));
    }

    @Test
    @DisplayName("Sách bán chạy: Chỉ thống kê từ đơn hợp lệ (DELIVERED/CONFIRMED), sắp xếp đúng số lượng hoặc doanh thu")
    void testTopSellingBooks() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        // Book 1: 3 quyển
        OrderItem item1 = OrderItem.builder()
                .book(book1)
                .bookTitle(book1.getTitle())
                .price(book1.getSalePrice())
                .quantity(3)
                .totalPrice(new BigDecimal("300000"))
                .build();
        createTestOrder(customer1, Order.OrderStatus.DELIVERED,
                new BigDecimal("300000"), now, List.of(item1));

        // Book 2: 1 quyển
        OrderItem item2 = OrderItem.builder()
                .book(book2)
                .bookTitle(book2.getTitle())
                .price(book2.getSalePrice())
                .quantity(1)
                .totalPrice(new BigDecimal("150000"))
                .build();
        createTestOrder(customer2, Order.OrderStatus.CONFIRMED,
                new BigDecimal("150000"), now, List.of(item2));

        // Top books theo quantity
        mockMvc.perform(get("/api/admin/reports/top-books")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .param("sortBy", "QUANTITY")
                        .param("size", "5")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data.content[0].bookTitle").value("Nhà Giả Kim Test"))
                .andExpect(jsonPath("$.data.content[0].soldQuantity").value(3));

        // Top books theo revenue
        mockMvc.perform(get("/api/admin/reports/top-books")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .param("sortBy", "REVENUE")
                        .param("size", "5")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].bookTitle").value("Nhà Giả Kim Test"))
                .andExpect(jsonPath("$.data.content[0].revenue").value(300000.0));
    }

    @Test
    @DisplayName("Hiệu suất danh mục và Khách hàng chi tiêu hàng đầu")
    void testCategoryPerformanceAndTopCustomers() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        OrderItem item1 = OrderItem.builder()
                .book(book1)
                .bookTitle(book1.getTitle())
                .price(book1.getSalePrice())
                .quantity(2)
                .totalPrice(new BigDecimal("200000"))
                .build();
        createTestOrder(customer1, Order.OrderStatus.DELIVERED,
                new BigDecimal("200000"), now, List.of(item1));

        // Category performance
        mockMvc.perform(get("/api/admin/reports/categories")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].categoryName", containsString("Văn Học")));

        // Top customers
        mockMvc.perform(get("/api/admin/reports/top-customers")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].fullName").value("Khách Hàng VIP"))
                .andExpect(jsonPath("$.data.content[0].totalSpent").value(200000.0));
    }

    @Test
    @DisplayName("Xuất CSV chuẩn UTF-8 BOM, kiểm tra headers và định dạng file tiếng Việt tương thích Excel")
    void testExportCsv_WithUtf8Bom() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        createTestOrder(customer1, Order.OrderStatus.DELIVERED,
                new BigDecimal("250000"), now, null);

        byte[] responseBytes = mockMvc.perform(get("/api/admin/reports/export-csv")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .param("reportType", "ORDERS")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=")))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        // Kiểm tra UTF-8 BOM: 0xEF, 0xBB, 0xBF
        assertNotNull(responseBytes);
        assertTrue(responseBytes.length >= 3);
        assertEquals((byte) 0xEF, responseBytes[0]);
        assertEquals((byte) 0xBB, responseBytes[1]);
        assertEquals((byte) 0xBF, responseBytes[2]);

        String csvContent = new String(responseBytes, StandardCharsets.UTF_8);
        assertTrue(csvContent.contains("Mã đơn hàng"));
        assertTrue(csvContent.contains("Khách hàng"));
        assertTrue(csvContent.contains("Trạng thái đơn"));
        assertTrue(csvContent.contains("Doanh thu thực nhận (VND)"));
    }

    @Test
    @DisplayName("Bảo mật & Phân quyền: ROLE_CUSTOMER bị từ chối 403, Khách vãng lai 401, STAFF & ADMIN được phép 200")
    void testRoleAuthorizationOnReportEndpoints() throws Exception {
        LocalDate today = LocalDate.now();

        // Khách hàng thường -> 403 Forbidden
        mockMvc.perform(get("/api/admin/reports/overview")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden());

        // Không có token -> 401 Unauthorized
        mockMvc.perform(get("/api/admin/reports/overview")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString()))
                .andExpect(status().isUnauthorized());

        // Nhân viên STAFF -> 200 OK
        mockMvc.perform(get("/api/admin/reports/overview")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());

        // Quản trị viên ADMIN -> 200 OK
        mockMvc.perform(get("/api/admin/reports/overview")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }
}
