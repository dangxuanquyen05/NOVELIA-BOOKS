package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.admin.dto.UpdateCustomerStatusRequest;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.OrderItem;
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
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminDashboardApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private AuthorRepository authorRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User staffUser;
    private User customerUser;
    private String adminToken;
    private String staffToken;
    private String customerToken;
    private Book testBook;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Quản trị viên").build()));
        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Nhân viên").build()));
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Khách hàng").build()));

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = userRepository.save(User.builder()
                .email("admin_" + suffix + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Quản Trị Viên " + suffix)
                .status(User.UserStatus.ACTIVE)
                .roles(new java.util.HashSet<>(Set.of(adminRole)))
                .build());

        staffUser = userRepository.save(User.builder()
                .email("staff_" + suffix + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Nhân Viên " + suffix)
                .status(User.UserStatus.ACTIVE)
                .roles(new java.util.HashSet<>(Set.of(staffRole)))
                .build());

        customerUser = userRepository.save(User.builder()
                .email("customer_" + suffix + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Khách Hàng " + suffix)
                .phone("0988776655")
                .status(User.UserStatus.ACTIVE)
                .roles(new java.util.HashSet<>(Set.of(customerRole)))
                .build());

        adminToken = generateToken(adminUser, "ROLE_ADMIN");
        staffToken = generateToken(staffUser, "ROLE_STAFF");
        customerToken = generateToken(customerUser, "ROLE_CUSTOMER");

        Author author = authorRepository.save(Author.builder()
                .name("Tác Giả Dashboard " + suffix)
                .slug("tac-gia-dashboard-" + suffix)
                .build());

        testBook = bookRepository.save(Book.builder()
                .title("Sách Bán Chạy Thử Nghiệm " + suffix)
                .slug("sach-ban-chay-" + suffix)
                .isbn("978" + (System.currentTimeMillis() % 10000000000L))
                .originalPrice(new BigDecimal("150000.00"))
                .salePrice(new BigDecimal("150000.00"))
                .status(Book.BookStatus.PUBLISHED)
                .authors(new java.util.HashSet<>(Set.of(author)))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(testBook)
                .quantity(15)
                .reservedQuantity(0)
                .lowStockThreshold(20) // Đặt threshold > quantity để kích hoạt cảnh báo low stock
                .build());
    }

    private String generateToken(User user, String roleName) {
        var auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority(roleName))
        );
        return jwtTokenProvider.generateTokenFromUsername(user.getEmail(), auth);
    }

    @Test
    @DisplayName("Admin truy cập Dashboard Stats thành công và nhận đủ dữ liệu phân tích")
    void testGetDashboardStats_AsAdmin_Success() throws Exception {
        // Tạo 1 đơn DELIVERED để có doanh thu
        createOrderWithStatus(Order.OrderStatus.DELIVERED, new BigDecimal("300000.00"), 2);

        mockMvc.perform(get("/api/admin/dashboard/stats?days=7")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.kpis.totalRevenue", notNullValue()))
                .andExpect(jsonPath("$.data.kpis.totalOrders", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.kpis.totalCustomers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.kpis.lowStockBooksCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.kpis.revenueRuleDescription", containsString("CONFIRMED, SHIPPING, DELIVERED")))
                .andExpect(jsonPath("$.data.revenueTrend", hasSize(7)))
                .andExpect(jsonPath("$.data.orderDistribution", not(empty())))
                .andExpect(jsonPath("$.data.topSellingBooks", notNullValue()))
                .andExpect(jsonPath("$.data.recentOrders", notNullValue()))
                .andExpect(jsonPath("$.data.lowStockAlerts", notNullValue()));
    }

    @Test
    @DisplayName("Admin truy cập Dashboard Stats với khoảng ngày tùy chọn thành công")
    void testGetDashboardStats_WithDateRange_Success() throws Exception {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate startDate = today.minusDays(5);

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .param("startDate", startDate.toString())
                        .param("endDate", today.toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.kpis.periodRevenue", notNullValue()))
                .andExpect(jsonPath("$.data.kpis.grossOrderValue", notNullValue()))
                .andExpect(jsonPath("$.data.kpis.averageOrderValue", notNullValue()))
                .andExpect(jsonPath("$.data.revenueTrend", hasSize(6)))
                .andExpect(jsonPath("$.data.categoryDistribution", notNullValue()));
    }

    @Test
    @DisplayName("Staff truy cập Dashboard Stats thành công")
    void testGetDashboardStats_AsStaff_Success() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Customer bị từ chối 403 Forbidden khi truy cập Dashboard Stats")
    void testGetDashboardStats_AsCustomer_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Khách chưa đăng nhập bị từ chối 401 Unauthorized")
    void testGetDashboardStats_Unauthenticated_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Quy tắc doanh thu: Loại trừ đơn CANCELLED và PENDING, chỉ tính CONFIRMED, SHIPPING, DELIVERED")
    void testRevenueRule_ExcludesCancelledAndPending() throws Exception {
        BigDecimal initialRevenue = orderRepository.calculateTotalRevenue(
                Set.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPING, Order.OrderStatus.DELIVERED)
        );
        if (initialRevenue == null) initialRevenue = BigDecimal.ZERO;

        // Tạo 1 đơn CANCELLED 500,000 VND
        createOrderWithStatus(Order.OrderStatus.CANCELLED, new BigDecimal("500000.00"), 3);
        // Tạo 1 đơn PENDING 200,000 VND
        createOrderWithStatus(Order.OrderStatus.PENDING, new BigDecimal("200000.00"), 1);
        // Tạo 1 đơn CONFIRMED 150,000 VND
        createOrderWithStatus(Order.OrderStatus.CONFIRMED, new BigDecimal("150000.00"), 1);

        BigDecimal expectedRevenue = initialRevenue.add(new BigDecimal("150000.00"));

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.kpis.totalRevenue", is(expectedRevenue.doubleValue())));
    }

    @Test
    @DisplayName("Admin xem danh sách khách hàng có phân trang và tìm kiếm thành công")
    void testGetCustomers_AsAdmin_Success() throws Exception {
        mockMvc.perform(get("/api/admin/customers?keyword=" + customerUser.getEmail() + "&page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].email", is(customerUser.getEmail())))
                .andExpect(jsonPath("$.data.content[0].fullName", is(customerUser.getFullName())))
                .andExpect(jsonPath("$.data.content[0].status", is("ACTIVE")));
    }

    @Test
    @DisplayName("Customer bị từ chối 403 Forbidden khi truy cập API quản lý khách hàng")
    void testGetCustomers_AsCustomer_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin cập nhật trạng thái khách hàng thành công (khóa tài khoản LOCKED)")
    void testUpdateCustomerStatus_AsAdmin_Success() throws Exception {
        UpdateCustomerStatusRequest request = new UpdateCustomerStatusRequest("LOCKED");

        mockMvc.perform(put("/api/admin/customers/" + customerUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("LOCKED")));

        User updated = userRepository.findById(customerUser.getId()).orElseThrow();
        assertEquals(User.UserStatus.LOCKED, updated.getStatus());
    }

    @Test
    @DisplayName("Staff bị từ chối 403 khi cố gắng đổi trạng thái khách hàng (chỉ Admin mới có quyền)")
    void testUpdateCustomerStatus_AsStaff_Forbidden() throws Exception {
        UpdateCustomerStatusRequest request = new UpdateCustomerStatusRequest("LOCKED");

        mockMvc.perform(put("/api/admin/customers/" + customerUser.getId() + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Cập nhật trạng thái người dùng với giá trị sai quy định trả về 400 Bad Request")
    void testUpdateCustomerStatus_InvalidStatus_BadRequest() throws Exception {
        UpdateCustomerStatusRequest request = new UpdateCustomerStatusRequest("INVALID_STATUS");

        mockMvc.perform(put("/api/admin/customers/" + customerUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    private Order createOrderWithStatus(Order.OrderStatus status, BigDecimal totalAmount, int quantity) {
        Order order = Order.builder()
                .orderNumber("NOV-TEST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .user(customerUser)
                .receiverName("Người Nhận Test")
                .receiverPhone("0912345678")
                .shippingAddress("123 Lê Lợi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh")
                .subtotal(totalAmount)
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(totalAmount)
                .status(status)
                .note("Đơn hàng thử nghiệm")
                .createdAt(LocalDateTime.now())
                .build();

        OrderItem item = OrderItem.builder()
                .order(order)
                .book(testBook)
                .bookTitle(testBook.getTitle())
                .bookCover(testBook.getCoverImage())
                .price(testBook.getSalePrice())
                .quantity(quantity)
                .totalPrice(totalAmount)
                .build();

        order.setItems(List.of(item));
        return orderRepository.save(order);
    }
}
