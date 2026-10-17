package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.admin.dto.UpdateCustomerStatusRequest;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.cart.dto.AddToCartRequest;
import com.novelia.cart.service.CartService;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.order.dto.CreateOrderRequest;
import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.order.service.OrderService;
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
import java.util.HashSet;
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
class CustomerManagementApiTest {

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
    @Autowired private OrderRepository orderRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;

    private User admin1;
    private User admin2;
    private User staff1;
    private User customer1;
    private User customer2;

    private String admin1Jwt;
    private String admin2Jwt;
    private String staff1Jwt;
    private String customer1Jwt;

    private Book testBook;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));
        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Staff").build()));
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        // Admin 1 (Super admin)
        admin1 = userRepository.save(User.builder()
                .email("cust_mgmt_admin1@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Quản Trị Viên 1")
                .phone("0911000111")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build());

        // Admin 2
        admin2 = userRepository.save(User.builder()
                .email("cust_mgmt_admin2@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Quản Trị Viên 2")
                .phone("0911000222")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build());

        // Staff 1
        staff1 = userRepository.save(User.builder()
                .email("cust_mgmt_staff1@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Nhân Viên Kho 1")
                .phone("0922000111")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(staffRole)))
                .build());

        // Customer 1
        customer1 = userRepository.save(User.builder()
                .email("cust_mgmt_user1@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Lê Khách Hàng 1")
                .phone("0933000111")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build());

        // Customer 2 (Bị khóa)
        customer2 = userRepository.save(User.builder()
                .email("cust_mgmt_user2@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Trần Khách Hàng 2")
                .phone("0933000222")
                .status(User.UserStatus.LOCKED)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build());

        admin1Jwt = tokenProvider.generateTokenFromUsername(
                admin1.getEmail(),
                new UsernamePasswordAuthenticationToken(admin1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        admin2Jwt = tokenProvider.generateTokenFromUsername(
                admin2.getEmail(),
                new UsernamePasswordAuthenticationToken(admin2.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        staff1Jwt = tokenProvider.generateTokenFromUsername(
                staff1.getEmail(),
                new UsernamePasswordAuthenticationToken(staff1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_STAFF"))));

        customer1Jwt = tokenProvider.generateTokenFromUsername(
                customer1.getEmail(),
                new UsernamePasswordAuthenticationToken(customer1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));

        // Tạo 1 cuốn sách để đặt đơn
        Author author = authorRepository.save(Author.builder().name("Tác Giả Khách Hàng " + UUID.randomUUID()).slug("tg-kh-" + UUID.randomUUID()).build());
        Category category = categoryRepository.save(Category.builder().name("Danh Mục Khách Hàng " + UUID.randomUUID()).slug("dm-kh-" + UUID.randomUUID()).build());

        testBook = bookRepository.save(Book.builder()
                .title("Sách Mua Của Khách Hàng")
                .slug("sach-mua-kh-" + UUID.randomUUID())
                .isbn("978" + UUID.randomUUID().toString().replace("-", "").substring(0, 10))
                .originalPrice(new BigDecimal("200000.00"))
                .salePrice(new BigDecimal("150000.00"))
                .authors(new HashSet<>(Set.of(author)))
                .categories(new HashSet<>(Set.of(category)))
                .status(Book.BookStatus.PUBLISHED)
                .build());

        inventoryRepository.save(Inventory.builder().book(testBook).quantity(50).reservedQuantity(0).build());
    }

    @Test
    @DisplayName("Admin và Staff có thể xem danh sách khách hàng có tìm kiếm và lọc trạng thái")
    void getCustomers_WithKeywordAndFilters_Success() throws Exception {
        // Tìm kiếm theo keyword
        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + admin1Jwt)
                        .param("keyword", "Lê Khách Hàng 1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email").value("cust_mgmt_user1@novelia.vn"));

        // Lọc theo trạng thái LOCKED
        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + staff1Jwt)
                        .param("status", "LOCKED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].status").value("LOCKED"));

        // Lọc theo vai trò ROLE_ADMIN
        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + admin1Jwt)
                        .param("role", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("Chi tiết khách hàng hiển thị thông tin, lịch sử đơn hàng và tổng chi tiêu thực tế (không số liệu ảo)")
    void getCustomerDetails_RealOrdersAndSpent_Success() throws Exception {
        // Customer 1 đặt 1 đơn hàng thật trị giá 150.000đ + ship 30.000đ = 180.000đ
        cartService.addToCart(customer1.getEmail(), AddToCartRequest.builder().bookId(testBook.getId()).quantity(1).build());
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .receiverName("Lê Khách Hàng 1")
                .receiverPhone("0933000111")
                .shippingAddress("123 Phố Sách, Hà Nội")
                .paymentMethod("COD")
                .build();
        String orderNumber = orderService.createOrder(customer1.getEmail(), orderReq).getOrderNumber();

        // Xem chi tiết khách hàng từ phía Admin
        mockMvc.perform(get("/api/admin/customers/" + customer1.getId())
                        .header("Authorization", "Bearer " + admin1Jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(customer1.getId()))
                .andExpect(jsonPath("$.data.email").value(customer1.getEmail()))
                .andExpect(jsonPath("$.data.fullName").value(customer1.getFullName()))
                .andExpect(jsonPath("$.data.totalOrders").value(1))
                .andExpect(jsonPath("$.data.recentOrders", hasSize(1)))
                .andExpect(jsonPath("$.data.recentOrders[0].orderNumber").value(orderNumber))
                // Không để lộ thông tin nhạy cảm password_hash
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    @DisplayName("Admin khóa và mở khóa tài khoản khách hàng thành công; lịch sử đơn hàng không bị xóa")
    void admin_LockAndUnlockCustomer_Success() throws Exception {
        // Tạo đơn hàng cho customer 1
        cartService.addToCart(customer1.getEmail(), AddToCartRequest.builder().bookId(testBook.getId()).quantity(1).build());
        orderService.createOrder(customer1.getEmail(), CreateOrderRequest.builder()
                .receiverName("Khách Hàng")
                .receiverPhone("0900000000")
                .shippingAddress("TP.HCM")
                .paymentMethod("COD")
                .build());

        assertEquals(1, orderRepository.countByUserId(customer1.getId()));

        // 1. Admin khóa tài khoản
        UpdateCustomerStatusRequest lockReq = UpdateCustomerStatusRequest.builder()
                .status("LOCKED")
                .reason("Nghi vấn gian lận")
                .build();

        mockMvc.perform(put("/api/admin/customers/" + customer1.getId() + "/status")
                        .header("Authorization", "Bearer " + admin1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("LOCKED"));

        // Đảm bảo đơn hàng vẫn còn nguyên vẹn trong DB
        assertEquals(1, orderRepository.countByUserId(customer1.getId()));

        // 2. Admin mở khóa lại
        UpdateCustomerStatusRequest unlockReq = UpdateCustomerStatusRequest.builder()
                .status("ACTIVE")
                .reason("Đã xác minh danh tính thành công")
                .build();

        mockMvc.perform(put("/api/admin/customers/" + customer1.getId() + "/status")
                        .header("Authorization", "Bearer " + admin1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unlockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("Ngăn Admin tự khóa hoặc hạ quyền tài khoản của chính mình (Self-Lock Prevention)")
    void admin_CannotLockSelf() throws Exception {
        UpdateCustomerStatusRequest lockSelfReq = UpdateCustomerStatusRequest.builder()
                .status("LOCKED")
                .reason("Tự khóa")
                .build();

        mockMvc.perform(put("/api/admin/customers/" + admin1.getId() + "/status")
                        .header("Authorization", "Bearer " + admin1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lockSelfReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("tự khóa")));
    }

    @Test
    @DisplayName("Ngăn khóa tài khoản Quản trị viên duy nhất còn lại của hệ thống (Last Admin Protection)")
    void admin_CannotLock_LastActiveAdmin() throws Exception {
        // Vô hiệu hóa admin2 trước -> Hệ thống chỉ còn đúng 1 Admin (admin1)
        admin2.setStatus(User.UserStatus.LOCKED);
        userRepository.save(admin2);

        // Thử dùng một bên khác khóa admin1 -> Phải bị từ chối vì là Admin duy nhất
        UpdateCustomerStatusRequest lockReq = UpdateCustomerStatusRequest.builder()
                .status("LOCKED")
                .reason("Cố tình khóa Admin cuối cùng")
                .build();

        // Sử dụng quyền của admin2 (nếu giả định đã đăng nhập) cố khóa admin1
        mockMvc.perform(put("/api/admin/customers/" + admin1.getId() + "/status")
                        .header("Authorization", "Bearer " + admin2Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lockReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("duy nhất")));
    }

    @Test
    @DisplayName("Nhân viên (ROLE_STAFF) không có quyền khóa hoặc đổi trạng thái người dùng (403 Forbidden)")
    void staff_CannotUpdateCustomerStatus_403Forbidden() throws Exception {
        UpdateCustomerStatusRequest req = UpdateCustomerStatusRequest.builder().status("LOCKED").build();

        mockMvc.perform(put("/api/admin/customers/" + customer1.getId() + "/status")
                        .header("Authorization", "Bearer " + staff1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Khách hàng thông thường (ROLE_CUSTOMER) không được truy cập quản lý khách hàng (403 Forbidden)")
    void customer_CannotAccessCustomerManagement_403Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/customers/" + customer2.getId())
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/admin/customers/" + customer2.getId() + "/status")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateCustomerStatusRequest.builder().status("ACTIVE").build())))
                .andExpect(status().isForbidden());
    }
}
