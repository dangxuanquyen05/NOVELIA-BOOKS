package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.admin.dto.UpdateCustomerStatusRequest;
import com.novelia.audit.entity.AuditLog;
import com.novelia.audit.repository.AuditLogRepository;
import com.novelia.audit.service.AuditLogService;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.dto.BookCreateRequest;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.coupon.entity.Coupon;
import com.novelia.coupon.repository.CouponRepository;
import com.novelia.inventory.dto.InventoryAdjustRequest;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.entity.InventoryTransaction;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.order.dto.CancelOrderRequest;
import com.novelia.order.dto.UpdateOrderStatusRequest;
import com.novelia.order.entity.Order;
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
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminSecurityAndAuditTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private BookRepository bookRepository;
    @Autowired private AuthorRepository authorRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private AuditLogService auditLogService;

    private User admin;
    private User staff;
    private User customer1;
    private User customer2;

    private String adminJwt;
    private String staffJwt;
    private String customer1Jwt;
    private String customer2Jwt;

    private Book testBook;
    private Author testAuthor;
    private Category testCategory;
    private Coupon testCoupon;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));
        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Staff").build()));
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        admin = userRepository.save(User.builder()
                .email("sec_admin_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Quản Trị Viên Bảo Mật")
                .phone("0981111222")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build());

        staff = userRepository.save(User.builder()
                .email("sec_staff_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Nhân Viên Nghiệp Vụ")
                .phone("0982222333")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(staffRole)))
                .build());

        customer1 = userRepository.save(User.builder()
                .email("sec_cust1_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Khách Hàng A")
                .phone("0983333444")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build());

        customer2 = userRepository.save(User.builder()
                .email("sec_cust2_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Khách Hàng B")
                .phone("0984444555")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build());

        adminJwt = tokenProvider.generateTokenFromUsername(admin.getEmail(),
                new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        staffJwt = tokenProvider.generateTokenFromUsername(staff.getEmail(),
                new UsernamePasswordAuthenticationToken(staff.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_STAFF"))));
        customer1Jwt = tokenProvider.generateTokenFromUsername(customer1.getEmail(),
                new UsernamePasswordAuthenticationToken(customer1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
        customer2Jwt = tokenProvider.generateTokenFromUsername(customer2.getEmail(),
                new UsernamePasswordAuthenticationToken(customer2.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));

        testAuthor = authorRepository.save(Author.builder()
                .name("Tác Giả Bảo Mật")
                .slug("tac-gia-bm-" + UUID.randomUUID())
                .build());

        testCategory = categoryRepository.save(Category.builder()
                .name("Thể Loại Bảo Mật")
                .slug("the-loai-bm-" + UUID.randomUUID())
                .build());

        testBook = bookRepository.save(Book.builder()
                .title("Tác Phẩm Bảo Mật Giai Đoạn 8")
                .slug("tac-pham-bm-gd8-" + UUID.randomUUID())
                .isbn("978" + (System.currentTimeMillis() % 10000000000L))
                .originalPrice(new BigDecimal("150000"))
                .salePrice(new BigDecimal("120000"))
                .status(Book.BookStatus.PUBLISHED)
                .authors(new HashSet<>(Set.of(testAuthor)))
                .categories(new HashSet<>(Set.of(testCategory)))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(testBook)
                .quantity(50)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build());

        testCoupon = couponRepository.save(Coupon.builder()
                .code("SECAUDIT10")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10"))
                .minOrderValue(new BigDecimal("50000"))
                .maxDiscountAmount(new BigDecimal("20000"))
                .usageLimit(100)
                .usageLimitPerUser(2)
                .usedCount(0)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build());
    }

    // ==========================================
    // 1. KIỂM THỬ BẢO VỆ API QUẢN TRỊ & PHÂN QUYỀN (RBAC)
    // ==========================================

    @Test
    @DisplayName("Khách hàng thông thường (CUSTOMER) bị từ chối 403 khi gọi bất kỳ API quản trị nào")
    void testCustomer_CannotAccessAdminApis_Forbidden() throws Exception {
        // Cố truy cập danh sách đơn admin
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());

        // Cố truy cập tồn kho admin
        mockMvc.perform(get("/api/admin/inventory")
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());

        // Cố truy cập nhật ký kiểm toán
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Nhân viên (STAFF) bị từ chối 403 khi truy cập API Nhật ký kiểm toán (/api/admin/audit-logs)")
    void testStaff_CannotAccessAdminAuditLogs_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Quản trị viên (ADMIN) có toàn quyền truy cập Nhật ký kiểm toán (/api/admin/audit-logs)")
    void testAdmin_CanAccessAuditLogs_Success() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("Phân định quyền: Nhân viên (STAFF) không được phép xóa sách (DELETE /api/books/{id}) -> Bị 403")
    void testStaff_CannotDeleteBook_Forbidden() throws Exception {
        mockMvc.perform(delete("/api/books/" + testBook.getId())
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Phân định quyền: Quản trị viên (ADMIN) được phép xóa hoặc ngưng kinh doanh sách")
    void testAdmin_CanDeleteBook_Success() throws Exception {
        mockMvc.perform(delete("/api/books/" + testBook.getId())
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Phân định quyền: Nhân viên (STAFF) không được kết thúc đột ngột hoặc xóa mã giảm giá -> Bị 403")
    void testStaff_CannotTerminateOrDeleteCoupon_Forbidden() throws Exception {
        mockMvc.perform(patch("/api/admin/coupons/" + testCoupon.getId() + "/terminate")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/admin/coupons/" + testCoupon.getId())
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Phân định quyền: Nhân viên (STAFF) không được phép khóa/mở khóa tài khoản khách -> Bị 403")
    void testStaff_CannotUpdateCustomerStatus_Forbidden() throws Exception {
        UpdateCustomerStatusRequest req = new UpdateCustomerStatusRequest();
        req.setStatus("LOCKED");
        req.setReason("Nghi ngờ vi phạm");

        mockMvc.perform(put("/api/admin/customers/" + customer1.getId() + "/status")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Ngăn Admin tự khóa hoặc vô hiệu hóa tài khoản của chính mình")
    void testAdmin_CannotLockSelf_BadRequest() throws Exception {
        UpdateCustomerStatusRequest req = new UpdateCustomerStatusRequest();
        req.setStatus("LOCKED");
        req.setReason("Thử tự khóa tài khoản");

        mockMvc.perform(put("/api/admin/customers/" + admin.getId() + "/status")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("tự khóa hoặc vô hiệu hóa tài khoản quản trị")));
    }

    // ==========================================
    // 2. KIỂM THỬ GHI NHẬT KÝ KIỂM TOÁN (AUDIT LOGS)
    // ==========================================

    @Test
    @DisplayName("Ghi nhận Audit Log tự động khi tạo sách mới (BOOK_CREATE)")
    void testAuditLog_RecordedOnBookCreation() throws Exception {
        long beforeCount = auditLogRepository.count();

        BookCreateRequest req = BookCreateRequest.builder()
                .title("Sách Thử Nghiệm Kiểm Toán")
                .isbn("978" + (System.currentTimeMillis() % 10000000000L))
                .originalPrice(new BigDecimal("100000"))
                .salePrice(new BigDecimal("90000"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .initialStock(20)
                .build();

        mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        long afterCount = auditLogRepository.count();
        assertTrue(afterCount > beforeCount, "Phải có ít nhất 1 bản ghi Audit Log được tạo");

        AuditLog latestLog = auditLogRepository.findAll().stream()
                .filter(l -> "BOOK_CREATE".equals(l.getAction()))
                .reduce((first, second) -> second)
                .orElse(null);

        assertNotNull(latestLog);
        assertEquals(staff.getEmail(), latestLog.getPerformedBy());
        assertEquals("BOOK", latestLog.getEntityType());
        assertEquals("SUCCESS", latestLog.getStatus());
        assertTrue(latestLog.getSummary().contains("Thêm tựa sách mới"));
    }

    @Test
    @DisplayName("Ghi nhận Audit Log tự động khi điều chỉnh tồn kho (INVENTORY_ADJUST)")
    void testAuditLog_RecordedOnInventoryAdjustment() throws Exception {
        InventoryAdjustRequest req = new InventoryAdjustRequest();
        req.setBookId(testBook.getId());
        req.setQuantityChange(15);
        req.setNote("Kiểm kê thực tế phát hiện dư");
        req.setTransactionType(InventoryTransaction.TransactionType.ADJUSTMENT);

        mockMvc.perform(post("/api/admin/inventory/adjust")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        AuditLog log = auditLogRepository.findAll().stream()
                .filter(l -> "INVENTORY_ADJUST".equals(l.getAction()))
                .reduce((first, second) -> second)
                .orElse(null);

        assertNotNull(log);
        assertEquals(staff.getEmail(), log.getPerformedBy());
        assertEquals("INVENTORY", log.getEntityType());
        assertEquals(testBook.getId().toString(), log.getEntityId());
        assertTrue(log.getSummary().contains("Điều chỉnh tồn kho"));
    }

    @Test
    @DisplayName("Ghi nhận Audit Log tự động khi cập nhật trạng thái đơn hàng (ORDER_STATUS_UPDATE)")
    void testAuditLog_RecordedOnOrderStatusUpdate() throws Exception {
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-SEC-STATUS-" + System.currentTimeMillis())
                .user(customer1)
                .subtotal(new BigDecimal("120000"))
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("120000"))
                .status(Order.OrderStatus.PENDING)
                .receiverName(customer1.getFullName())
                .receiverPhone(customer1.getPhone())
                .shippingAddress("123 Phố Bảo Mật")
                .items(new ArrayList<>())
                .build());

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setNewStatus(Order.OrderStatus.CONFIRMED);
        req.setNote("Đã xác nhận thanh toán và duyệt đơn");

        mockMvc.perform(put("/api/admin/orders/" + order.getOrderNumber() + "/status")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        AuditLog log = auditLogRepository.findAll().stream()
                .filter(l -> "ORDER_STATUS_UPDATE".equals(l.getAction()))
                .reduce((first, second) -> second)
                .orElse(null);

        assertNotNull(log);
        assertEquals(staff.getEmail(), log.getPerformedBy());
        assertEquals("ORDER", log.getEntityType());
        assertEquals(order.getOrderNumber(), log.getEntityId());
        assertTrue(log.getSummary().contains("CONFIRMED"));
    }

    @Test
    @DisplayName("Khử nhạy cảm dữ liệu (Sanitization): Tuyệt đối không lưu password hoặc token vào Audit Log")
    void testAuditLog_SanitizesSensitiveData_NoPasswordsOrTokens() {
        String sensitiveDetails = "{\"username\":\"admin\",\"password\":\"VerySecret123!\",\"token\":\"eyJhbGciOi...\"}";
        auditLogService.log("tester@novelia.vn", "TEST_ACTION", "SYSTEM", "1", "Kiểm tra khử dữ liệu nhạy cảm", sensitiveDetails);

        AuditLog log = auditLogRepository.findAll().stream()
                .filter(l -> "TEST_ACTION".equals(l.getAction()))
                .reduce((first, second) -> second)
                .orElse(null);

        assertNotNull(log);
        assertFalse(log.getDetails().contains("VerySecret123!"), "Mật khẩu tuyệt đối không được xuất hiện trong log");
        assertFalse(log.getDetails().contains("eyJhbGciOi"), "Token nhạy cảm tuyệt đối không được xuất hiện trong log");
        assertTrue(log.getDetails().contains("***REDACTED***"), "Dữ liệu nhạy cảm phải được thay bằng ***REDACTED***");
    }

    // ==========================================
    // 3. CHỐNG TRUY CẬP TRÁI PHÉP & TRUY CẬP CHÉO DỮ LIỆU (ANTI-IDOR)
    // ==========================================

    @Test
    @DisplayName("Chống IDOR: Khách hàng A không thể xem đơn hàng của Khách hàng B bằng cách sửa mã đơn")
    void testIDOR_CustomerCannotViewAnotherCustomerOrder_Forbidden() throws Exception {
        // Đơn hàng thuộc về customer2
        Order orderOfCustomer2 = orderRepository.save(Order.builder()
                .orderNumber("ORD-CUST2-SECRET-" + System.currentTimeMillis())
                .user(customer2)
                .subtotal(new BigDecimal("120000"))
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("120000"))
                .status(Order.OrderStatus.PENDING)
                .receiverName(customer2.getFullName())
                .receiverPhone(customer2.getPhone())
                .shippingAddress("Địa chỉ nhà riêng bí mật của B")
                .items(new ArrayList<>())
                .build());

        // Customer1 thử truyền mã đơn của Customer2 -> Bị từ chối 403 Access Denied
        mockMvc.perform(get("/api/orders/" + orderOfCustomer2.getOrderNumber())
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Chống IDOR: Khách hàng A không thể hủy đơn hàng của Khách hàng B")
    void testIDOR_CustomerCannotCancelAnotherCustomerOrder_Forbidden() throws Exception {
        Order orderOfCustomer2 = orderRepository.save(Order.builder()
                .orderNumber("ORD-CUST2-CANCEL-TEST-" + System.currentTimeMillis())
                .user(customer2)
                .subtotal(new BigDecimal("120000"))
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("120000"))
                .status(Order.OrderStatus.PENDING)
                .receiverName(customer2.getFullName())
                .receiverPhone(customer2.getPhone())
                .shippingAddress("Địa chỉ B")
                .items(new ArrayList<>())
                .build());

        CancelOrderRequest cancelReq = new CancelOrderRequest();
        cancelReq.setReason("Tôi muốn hủy đơn của người khác");

        mockMvc.perform(put("/api/orders/" + orderOfCustomer2.getOrderNumber() + "/cancel")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Bảo đảm nhật ký kiểm toán không thể bị sửa hoặc xóa tùy tiện qua API (Append-only / Tamper-proof)")
    void testAuditLog_TamperProof_NoModificationEndpoints() throws Exception {
        AuditLog sampleLog = auditLogRepository.save(AuditLog.builder()
                .performedBy("admin@novelia.vn")
                .action("SECURITY_EVENT")
                .entityType("SYSTEM")
                .summary("Nhật ký quan trọng")
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build());

        // Không có endpoint PUT / PATCH / DELETE cho audit logs (Trả về 404 Not Found hoặc 405 Method Not Allowed)
        mockMvc.perform(delete("/api/admin/audit-logs/" + sampleLog.getId())
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 404 || status == 405, "Không được phép có endpoint xóa audit log, kết quả phải là 404 hoặc 405");
                });

        mockMvc.perform(put("/api/admin/audit-logs/" + sampleLog.getId())
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"summary\":\"Thay đổi nhật ký giả mạo\"}"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 404 || status == 405, "Không được phép có endpoint sửa audit log, kết quả phải là 404 hoặc 405");
                });
    }
}
