package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.cart.dto.AddToCartRequest;
import com.novelia.cart.service.CartService;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.inventory.dto.InventoryAdjustRequest;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.entity.InventoryTransaction;
import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.inventory.repository.InventoryTransactionRepository;
import com.novelia.order.dto.CancelOrderRequest;
import com.novelia.order.dto.CreateOrderRequest;
import com.novelia.order.dto.UpdateOrderStatusRequest;
import com.novelia.order.dto.UpdatePaymentStatusRequest;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.Order.OrderStatus;
import com.novelia.order.repository.OrderRepository;
import com.novelia.order.service.OrderService;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.entity.Payment.PaymentMethod;
import com.novelia.payment.entity.Payment.PaymentStatus;
import com.novelia.payment.repository.PaymentRepository;
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
class OrderAndInventoryManagementTest {

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
    @Autowired private InventoryTransactionRepository inventoryTransactionRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private CartService cartService;
    @Autowired private OrderService orderService;

    private User customer1;
    private User customer2;
    private User adminUser;
    private String customer1Jwt;
    private String customer2Jwt;
    private String adminJwt;

    private Book testBook;
    private final int INITIAL_STOCK = 30;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));

        customer1 = userRepository.save(User.builder()
                .email("mgmt_cust1@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Khách Hàng Một")
                .phone("0901111222")
                .roles(Set.of(customerRole))
                .build());
        UsernamePasswordAuthenticationToken auth1 = new UsernamePasswordAuthenticationToken(
                customer1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        customer1Jwt = tokenProvider.generateTokenFromUsername(customer1.getEmail(), auth1);

        customer2 = userRepository.save(User.builder()
                .email("mgmt_cust2@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Khách Hàng Hai")
                .phone("0903333444")
                .roles(Set.of(customerRole))
                .build());
        UsernamePasswordAuthenticationToken auth2 = new UsernamePasswordAuthenticationToken(
                customer2.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        customer2Jwt = tokenProvider.generateTokenFromUsername(customer2.getEmail(), auth2);

        adminUser = userRepository.save(User.builder()
                .email("mgmt_admin@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Quản Trị Viên")
                .phone("0909999888")
                .roles(Set.of(adminRole))
                .build());
        UsernamePasswordAuthenticationToken authAdmin = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        adminJwt = tokenProvider.generateTokenFromUsername(adminUser.getEmail(), authAdmin);

        Author author = authorRepository.save(Author.builder()
                .name("Tác Giả Kho Sách")
                .slug("tac-gia-kho-sach-" + UUID.randomUUID())
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Thể Loại Kho")
                .slug("the-loai-kho-" + UUID.randomUUID())
                .build());

        testBook = bookRepository.save(Book.builder()
                .title("Kiểm Thử Nghiệp Vụ Đơn Hàng")
                .slug("kiem-thu-nghiep-vu-don-hang-" + UUID.randomUUID())
                .isbn("978604" + (System.currentTimeMillis() % 10000000))
                .originalPrice(new BigDecimal("200000"))
                .salePrice(new BigDecimal("180000"))
                .authors(Set.of(author))
                .categories(Set.of(category))
                .build());

        Inventory inventory = inventoryRepository.save(Inventory.builder()
                .book(testBook)
                .quantity(INITIAL_STOCK)
                .reservedQuantity(0)
                .lowStockThreshold(10)
                .build());
    }

    private Order createTestOrderForCustomer(User customer, int quantity) {
        cartService.addToCart(customer.getEmail(), new AddToCartRequest(testBook.getId(), quantity));
        CreateOrderRequest request = CreateOrderRequest.builder()
                .receiverName(customer.getFullName())
                .receiverPhone(customer.getPhone())
                .detailedAddress("123 Phố Sách")
                .province("Hà Nội")
                .district("Hoàn Kiếm")
                .ward("Tràng Tiền")
                .paymentMethod("COD")
                .build();
        var resp = orderService.createOrder(customer.getEmail(), request);
        return orderRepository.findByOrderNumber(resp.getOrderNumber()).orElseThrow();
    }

    @Test
    @DisplayName("Khách hàng xem danh sách đơn hàng của chính mình (có phân trang và lọc status)")
    void getMyOrders_Customer_Success() throws Exception {
        createTestOrderForCustomer(customer1, 2);

        mockMvc.perform(get("/api/orders/my-orders")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .param("status", "PENDING")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].userEmail").value(customer1.getEmail()))
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("Khách hàng hủy đơn hàng PENDING thành công: trạng thái chuyển CANCELLED, hoàn kho và ghi log")
    void cancelOrder_Customer_Success() throws Exception {
        Order order = createTestOrderForCustomer(customer1, 4);

        // Tồn kho sau khi đặt 4 cuốn: 30 - 4 = 26
        Inventory invBeforeCancel = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        assertEquals(26, invBeforeCancel.getAvailableQuantity());

        CancelOrderRequest cancelReq = new CancelOrderRequest("Thay đổi ý định mua sách");

        mockMvc.perform(put("/api/orders/" + order.getOrderNumber() + "/cancel")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.note", containsString("Thay đổi ý định")));

        // Kiểm tra tồn kho được hoàn lại an toàn: 26 + 4 = 30
        Inventory invAfterCancel = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        assertEquals(30, invAfterCancel.getQuantity());
        assertEquals(30, invAfterCancel.getAvailableQuantity());

        // Kiểm tra lịch sử biến động kho có bản ghi CANCEL_RETURN
        List<InventoryTransaction> txs = inventoryTransactionRepository.findByBookIdOrderByCreatedAtDesc(testBook.getId());
        assertEquals(TransactionType.CANCEL_RETURN, txs.get(0).getTransactionType());
        assertEquals(4, txs.get(0).getQuantityChange());
        assertEquals(30, txs.get(0).getRemainingQuantity());
    }

    @Test
    @DisplayName("Chặn khách hàng hủy đơn của người khác (403 Forbidden)")
    void cancelOrder_Customer_Forbidden_WhenNotOwner() throws Exception {
        Order orderOfCustomer2 = createTestOrderForCustomer(customer2, 1);

        CancelOrderRequest cancelReq = new CancelOrderRequest("Cố tình hủy");

        // Customer1 cố tình hủy đơn của Customer2
        mockMvc.perform(put("/api/orders/" + orderOfCustomer2.getOrderNumber() + "/cancel")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Chặn khách hàng hủy đơn khi đơn không còn ở trạng thái PENDING (400 Bad Request)")
    void cancelOrder_Customer_BadRequest_WhenNotPending() throws Exception {
        Order order = createTestOrderForCustomer(customer1, 2);

        // Đơn đã được duyệt sang CONFIRMED
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        CancelOrderRequest cancelReq = new CancelOrderRequest("Hủy đơn");

        mockMvc.perform(put("/api/orders/" + order.getOrderNumber() + "/cancel")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Đảm bảo không hoàn kho nhiều lần khi gọi hủy lặp lại")
    void cancelOrder_PreventDuplicateRestock() throws Exception {
        Order order = createTestOrderForCustomer(customer1, 3);

        // Hủy lần 1 thành công
        CancelOrderRequest cancelReq = new CancelOrderRequest("Hủy");
        mockMvc.perform(put("/api/orders/" + order.getOrderNumber() + "/cancel")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk());

        Inventory invAfterFirstCancel = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        assertEquals(30, invAfterFirstCancel.getQuantity());

        // Hủy lần 2 (cố ý retry) -> phải bị báo lỗi và kho không đổi
        mockMvc.perform(put("/api/orders/" + order.getOrderNumber() + "/cancel")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isBadRequest());

        Inventory invAfterSecondCancel = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        assertEquals(30, invAfterSecondCancel.getQuantity()); // Tồn kho vẫn là 30, không bị cộng thêm lần 2!
    }

    @Test
    @DisplayName("Admin/Staff tìm kiếm và lọc danh sách đơn hàng")
    void admin_GetOrders_FilterAndSearch() throws Exception {
        Order order = createTestOrderForCustomer(customer1, 1);

        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + adminJwt)
                        .param("status", "PENDING")
                        .param("keyword", order.getOrderNumber()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].orderNumber").value(order.getOrderNumber()));
    }

    @Test
    @DisplayName("Admin/Staff cập nhật trạng thái hợp lệ và tự động cập nhật thanh toán COD khi giao thành công")
    void admin_UpdateOrderStatus_StateTransitions_AndPaymentPaid() throws Exception {
        Order order = createTestOrderForCustomer(customer1, 2);

        // 1. PENDING -> CONFIRMED
        mockMvc.perform(put("/api/admin/orders/" + order.getOrderNumber() + "/status")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest(OrderStatus.CONFIRMED, "Đã gọi xác nhận"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        // 2. CONFIRMED -> SHIPPING
        mockMvc.perform(put("/api/admin/orders/" + order.getOrderNumber() + "/status")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest(OrderStatus.SHIPPING, "Bàn giao bưu cục"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SHIPPING"));

        // 3. SHIPPING -> DELIVERED (Tự động cập nhật Payment sang PAID)
        mockMvc.perform(put("/api/admin/orders/" + order.getOrderNumber() + "/status")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest(OrderStatus.DELIVERED, "Giao thành công"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"));

        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElseThrow();
        assertEquals(PaymentStatus.PAID, payment.getPaymentStatus());
    }

    @Test
    @DisplayName("Chặn chuyển trạng thái tùy tiện (State Machine Validation)")
    void admin_UpdateOrderStatus_InvalidTransition_BadRequest() throws Exception {
        Order order = createTestOrderForCustomer(customer1, 1);

        // PENDING không thể nhảy thẳng sang DELIVERED
        mockMvc.perform(put("/api/admin/orders/" + order.getOrderNumber() + "/status")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequest(OrderStatus.DELIVERED, "Giao ngay"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin theo dõi tồn kho và lọc cảnh báo tồn thấp")
    void admin_Inventory_LowStockAlert() throws Exception {
        // Giảm tồn kho xuống 3 cuốn (<= ngưỡng 10 cuốn)
        Inventory inv = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        inv.setQuantity(3);
        inventoryRepository.save(inv);

        // Lọc danh sách sách tồn kho thấp
        mockMvc.perform(get("/api/admin/inventory")
                        .header("Authorization", "Bearer " + adminJwt)
                        .param("lowStockOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].isLowStock").value(true));

        // Kiểm tra API đếm số sách cảnh báo tồn thấp
        mockMvc.perform(get("/api/admin/inventory/low-stock-count")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Admin điều chỉnh tồn kho (nhập hàng) và kiểm tra lịch sử biến động")
    void admin_AdjustInventory_Success() throws Exception {
        InventoryAdjustRequest adjustReq = InventoryAdjustRequest.builder()
                .bookId(testBook.getId())
                .quantityChange(50)
                .transactionType(TransactionType.IMPORT)
                .note("Nhập hàng từ NXB đợt 2")
                .build();

        mockMvc.perform(post("/api/admin/inventory/adjust")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.quantity").value(INITIAL_STOCK + 50));

        // Kiểm tra lịch sử giao dịch kho
        mockMvc.perform(get("/api/admin/inventory/transactions")
                        .header("Authorization", "Bearer " + adminJwt)
                        .param("bookId", testBook.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].transactionType").value("IMPORT"))
                .andExpect(jsonPath("$.data.content[0].quantityChange").value(50));
    }

    @Test
    @DisplayName("Chặn điều chỉnh tồn kho khiến số lượng bị âm (< 0)")
    void admin_AdjustInventory_NegativeQuantity_BadRequest() throws Exception {
        InventoryAdjustRequest adjustReq = InventoryAdjustRequest.builder()
                .bookId(testBook.getId())
                .quantityChange(-999) // Quá số lượng hiện tại
                .transactionType(TransactionType.ADJUSTMENT)
                .note("Điều chỉnh hao hụt lỗi")
                .build();

        mockMvc.perform(post("/api/admin/inventory/adjust")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Khách hàng không được truy cập các endpoint quản trị Admin/Staff (403 Forbidden)")
    void customer_CannotAccess_AdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/inventory")
                        .header("Authorization", "Bearer " + customer1Jwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin cập nhật trạng thái thanh toán riêng biệt độc lập với giao hàng")
    void admin_UpdatePaymentStatus_Success() throws Exception {
        // Khách 1 đặt đơn
        cartService.addToCart("mgmt_cust1@novelia.vn", AddToCartRequest.builder().bookId(testBook.getId()).quantity(1).build());
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn A")
                .receiverPhone("0901234567")
                .shippingAddress("123 Lê Lợi, Q1, TP.HCM")
                .paymentMethod("BANK_TRANSFER")
                .build();
        String orderNumber = orderService.createOrder("mgmt_cust1@novelia.vn", orderReq).getOrderNumber();

        // Admin cập nhật trạng thái thanh toán sang PAID kèm mã GD và ghi chú
        UpdatePaymentStatusRequest payReq = UpdatePaymentStatusRequest.builder()
                .newStatus(PaymentStatus.PAID)
                .transactionCode("VNP-BANK-889900")
                .note("Đã nhận tiền qua sao kê VCB lúc 15h00")
                .build();

        mockMvc.perform(put("/api/admin/orders/" + orderNumber + "/payment")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.data.paymentTransactionCode").value("VNP-BANK-889900"))
                .andExpect(jsonPath("$.data.paidAt").isNotEmpty());

        // Kiểm tra lại chi tiết đơn
        mockMvc.perform(get("/api/admin/orders/" + orderNumber)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.data.paymentTransactionCode").value("VNP-BANK-889900"));
    }

    @Test
    @DisplayName("Hệ thống ghi nhận đầy đủ lịch sử chuyển trạng thái và thao tác kiểm toán (Audit History)")
    void order_StatusHistory_RecordedCorrectly() throws Exception {
        // 1. Tạo đơn hàng
        cartService.addToCart("mgmt_cust1@novelia.vn", AddToCartRequest.builder().bookId(testBook.getId()).quantity(1).build());
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn B")
                .receiverPhone("0908889999")
                .shippingAddress("456 Hai Bà Trưng, Q3, TP.HCM")
                .paymentMethod("COD")
                .build();
        String orderNumber = orderService.createOrder("mgmt_cust1@novelia.vn", orderReq).getOrderNumber();

        // 2. Admin xác nhận đơn
        orderService.updateOrderStatusForAdmin(orderNumber,
                UpdateOrderStatusRequest.builder().newStatus(OrderStatus.CONFIRMED).note("Kho đã đóng gói xong").build(),
                "mgmt_admin@novelia.vn");

        // 3. Admin chuyển sang giao hàng
        orderService.updateOrderStatusForAdmin(orderNumber,
                UpdateOrderStatusRequest.builder().newStatus(OrderStatus.SHIPPING).note("Bàn giao bưu tá GHTK").build(),
                "mgmt_admin@novelia.vn");

        // 4. Lấy chi tiết đơn hàng và kiểm tra timeline histories
        mockMvc.perform(get("/api/admin/orders/" + orderNumber)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.histories", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.data.histories[0].action").value("TẠO ĐƠN HÀNG MỚI"))
                .andExpect(jsonPath("$.data.histories[1].action").value("CHUYỂN TRẠNG THÁI"))
                .andExpect(jsonPath("$.data.histories[1].toStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.histories[2].toStatus").value("SHIPPING"));
    }

    @Test
    @DisplayName("Hoàn kho an toàn khi hủy đơn và chống hoàn kho lặp (Idempotent Inventory Restoration)")
    void cancelOrder_RestoresInventory_OnlyOnce_Idempotent() throws Exception {
        int initialStock = inventoryRepository.findByBookId(testBook.getId()).orElseThrow().getQuantity();

        // Khách đặt 2 cuốn -> Tồn kho giảm 2
        cartService.addToCart("mgmt_cust1@novelia.vn", AddToCartRequest.builder().bookId(testBook.getId()).quantity(2).build());
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn C")
                .receiverPhone("0907776666")
                .shippingAddress("789 Trần Hưng Đạo, Q5, TP.HCM")
                .paymentMethod("COD")
                .build();
        String orderNumber = orderService.createOrder("mgmt_cust1@novelia.vn", orderReq).getOrderNumber();

        int stockAfterOrder = inventoryRepository.findByBookId(testBook.getId()).orElseThrow().getQuantity();
        assertEquals(initialStock - 2, stockAfterOrder);

        // Khách hủy đơn -> Tồn kho tăng lại đúng 2
        orderService.cancelOrder("mgmt_cust1@novelia.vn", orderNumber,
                CancelOrderRequest.builder().reason("Đổi ý không mua nữa").build());

        int stockAfterCancel = inventoryRepository.findByBookId(testBook.getId()).orElseThrow().getQuantity();
        assertEquals(initialStock, stockAfterCancel);

        // Kiểm tra cờ inventoryRestored của Order
        Order order = orderRepository.findByOrderNumber(orderNumber).orElseThrow();
        assertTrue(Boolean.TRUE.equals(order.getInventoryRestored()));

        // Thử gọi hủy lần nữa -> Phải báo lỗi đơn đã hủy và KHÔNG được cộng tồn kho tiếp
        assertThrows(Exception.class, () -> {
            orderService.cancelOrder("mgmt_cust1@novelia.vn", orderNumber,
                    CancelOrderRequest.builder().reason("Hủy tiếp").build());
        });

        int finalStock = inventoryRepository.findByBookId(testBook.getId()).orElseThrow().getQuantity();
        assertEquals(initialStock, finalStock);
    }

    @Test
    @DisplayName("Đơn hàng đã giao thành công (DELIVERED) không được phép hủy tùy tiện")
    void order_CannotCancel_WhenDelivered() throws Exception {
        cartService.addToCart("mgmt_cust1@novelia.vn", AddToCartRequest.builder().bookId(testBook.getId()).quantity(1).build());
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn D")
                .receiverPhone("0905554444")
                .shippingAddress("101 Nam Kỳ Khởi Nghĩa, Q1, TP.HCM")
                .paymentMethod("COD")
                .build();
        String orderNumber = orderService.createOrder("mgmt_cust1@novelia.vn", orderReq).getOrderNumber();

        // Chuyển sang CONFIRMED -> SHIPPING -> DELIVERED
        orderService.updateOrderStatusForAdmin(orderNumber, UpdateOrderStatusRequest.builder().newStatus(OrderStatus.CONFIRMED).build(), "mgmt_admin@novelia.vn");
        orderService.updateOrderStatusForAdmin(orderNumber, UpdateOrderStatusRequest.builder().newStatus(OrderStatus.SHIPPING).build(), "mgmt_admin@novelia.vn");
        orderService.updateOrderStatusForAdmin(orderNumber, UpdateOrderStatusRequest.builder().newStatus(OrderStatus.DELIVERED).build(), "mgmt_admin@novelia.vn");

        // Khách hoặc Admin cố tình hủy đơn đã DELIVERED -> Phải bị từ chối 400 Bad Request
        mockMvc.perform(put("/api/orders/" + orderNumber + "/cancel")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CancelOrderRequest.builder().reason("Muốn hủy").build())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin lọc đơn hàng nâng cao theo phương thức thanh toán, trạng thái thanh toán và khoảng ngày")
    void admin_FilterOrders_ByPaymentAndDate() throws Exception {
        // Tạo 1 đơn COD và 1 đơn BANK_TRANSFER
        cartService.addToCart("mgmt_cust1@novelia.vn", AddToCartRequest.builder().bookId(testBook.getId()).quantity(1).build());
        orderService.createOrder("mgmt_cust1@novelia.vn", CreateOrderRequest.builder()
                .receiverName("Khách COD")
                .receiverPhone("0901111111")
                .shippingAddress("Đường 1, TP.HCM")
                .paymentMethod("COD")
                .build());

        cartService.addToCart("mgmt_cust1@novelia.vn", AddToCartRequest.builder().bookId(testBook.getId()).quantity(1).build());
        orderService.createOrder("mgmt_cust1@novelia.vn", CreateOrderRequest.builder()
                .receiverName("Khách Bank")
                .receiverPhone("0902222222")
                .shippingAddress("Đường 2, TP.HCM")
                .paymentMethod("BANK_TRANSFER")
                .build());

        // Lọc theo paymentMethod=BANK_TRANSFER
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + adminJwt)
                        .param("paymentMethod", "BANK_TRANSFER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].paymentMethod").value("BANK_TRANSFER"));

        // Lọc theo paymentStatus=UNPAID
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + adminJwt)
                        .param("paymentStatus", "UNPAID"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Khách hàng không thể tự cập nhật trạng thái thanh toán (403 Forbidden)")
    void customer_CannotUpdate_PaymentStatus() throws Exception {
        UpdatePaymentStatusRequest payReq = UpdatePaymentStatusRequest.builder()
                .newStatus(PaymentStatus.PAID)
                .transactionCode("FAKE123")
                .build();

        mockMvc.perform(put("/api/admin/orders/NOV-TEST/payment")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isForbidden());
    }
}
