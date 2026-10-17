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
import com.novelia.inventory.dto.*;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.entity.InventoryTransaction;
import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.inventory.repository.InventoryTransactionRepository;
import com.novelia.order.dto.CancelOrderRequest;
import com.novelia.order.dto.CreateOrderRequest;
import com.novelia.order.dto.OrderResponse;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class InventoryManagementApiTest {

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
    @Autowired private OrderService orderService;
    @Autowired private CartService cartService;

    private User adminUser;
    private User staffUser;
    private User customerUser;
    private Role customerRole;
    private String adminJwt;
    private String staffJwt;
    private String customerJwt;

    private Book book1;
    private Book book2;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));
        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Staff").build()));
        customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        adminUser = userRepository.save(User.builder()
                .email("inv_admin_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Quản Lý Kho Admin")
                .phone("0908111222")
                .roles(Set.of(adminRole))
                .build());
        adminJwt = tokenProvider.generateTokenFromUsername(adminUser.getEmail(),
                new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        staffUser = userRepository.save(User.builder()
                .email("inv_staff_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Thủ Kho Staff")
                .phone("0908333444")
                .roles(Set.of(staffRole))
                .build());
        staffJwt = tokenProvider.generateTokenFromUsername(staffUser.getEmail(),
                new UsernamePasswordAuthenticationToken(staffUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_STAFF"))));

        customerUser = userRepository.save(User.builder()
                .email("inv_cust_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Khách Mua Sách")
                .phone("0908555666")
                .roles(Set.of(customerRole))
                .build());
        customerJwt = tokenProvider.generateTokenFromUsername(customerUser.getEmail(),
                new UsernamePasswordAuthenticationToken(customerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));

        Author author = authorRepository.save(Author.builder()
                .name("Tác Giả Kho " + UUID.randomUUID())
                .slug("tg-kho-" + UUID.randomUUID())
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Danh Mục Kho " + UUID.randomUUID())
                .slug("dm-kho-" + UUID.randomUUID())
                .build());

        book1 = bookRepository.save(Book.builder()
                .title("Sách Kho Thử Nghiệm 1")
                .slug("sach-kho-1-" + UUID.randomUUID())
                .isbn("978" + UUID.randomUUID().toString().replace("-", "").substring(0, 10))
                .originalPrice(new BigDecimal("100000.00"))
                .salePrice(new BigDecimal("80000.00"))
                .status(Book.BookStatus.PUBLISHED)
                .authors(Set.of(author))
                .categories(Set.of(category))
                .build());

        book2 = bookRepository.save(Book.builder()
                .title("Sách Kho Thử Nghiệm 2 Sắp Hết")
                .slug("sach-kho-2-" + UUID.randomUUID())
                .isbn("978" + UUID.randomUUID().toString().replace("-", "").substring(0, 10))
                .originalPrice(new BigDecimal("200000.00"))
                .salePrice(new BigDecimal("150000.00"))
                .status(Book.BookStatus.PUBLISHED)
                .authors(Set.of(author))
                .categories(Set.of(category))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(book1)
                .quantity(50)
                .reservedQuantity(0)
                .lowStockThreshold(10)
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(book2)
                .quantity(3)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build());
    }

    @Test
    @DisplayName("1. Lấy danh sách tồn kho, lọc theo tình trạng và xem summary KPI")
    void getInventories_FilterAndSummary_Success() throws Exception {
        // Test GET /api/admin/inventory with status=LOW_STOCK
        mockMvc.perform(get("/api/admin/inventory")
                        .param("status", "LOW_STOCK")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));

        // Test GET /api/admin/inventory/summary
        mockMvc.perform(get("/api/admin/inventory/summary")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalBooks").isNumber())
                .andExpect(jsonPath("$.data.lowStockCount").isNumber())
                .andExpect(jsonPath("$.data.totalPhysicalStock").isNumber());
    }

    @Test
    @DisplayName("2. Lập phiếu nhập hàng (Goods Receipt) tăng số lượng tồn và lưu nhật ký IMPORT")
    void createGoodsReceipt_BatchImport_Success() throws Exception {
        GoodsReceiptRequest request = GoodsReceiptRequest.builder()
                .receiptCode("PN-TEST-2026")
                .supplierName("NXB Kim Đồng")
                .note("Nhập đợt 1")
                .items(List.of(
                        new GoodsReceiptRequest.ReceiptItem(book1.getId(), 20, new BigDecimal("50000")),
                        new GoodsReceiptRequest.ReceiptItem(book2.getId(), 15, new BigDecimal("100000"))
                ))
                .build();

        mockMvc.perform(post("/api/admin/inventory/import-receipt")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.receiptCode").value("PN-TEST-2026"))
                .andExpect(jsonPath("$.data.totalQuantity").value(35))
                .andExpect(jsonPath("$.data.performedBy").value(adminUser.getEmail()));

        // Kiểm tra tồn kho đã tăng
        Inventory inv1 = inventoryRepository.findByBookId(book1.getId()).orElseThrow();
        assertEquals(70, inv1.getQuantity()); // 50 + 20

        Inventory inv2 = inventoryRepository.findByBookId(book2.getId()).orElseThrow();
        assertEquals(18, inv2.getQuantity()); // 3 + 15

        // Kiểm tra nhật ký biến động kho đã lưu
        List<InventoryTransaction> txs = inventoryTransactionRepository.findByBookIdOrderByCreatedAtDesc(book1.getId());
        assertFalse(txs.isEmpty());
        InventoryTransaction latestTx = txs.get(0);
        assertEquals(TransactionType.IMPORT, latestTx.getTransactionType());
        assertEquals(20, latestTx.getQuantityChange());
        assertEquals(70, latestTx.getRemainingQuantity());
        assertEquals(adminUser.getEmail(), latestTx.getPerformedBy());
        assertTrue(latestTx.getNote().contains("PN-TEST-2026"));
    }

    @Test
    @DisplayName("3. Điều chỉnh kiểm kê tồn kho có lý do, người thực hiện và truy vết lịch sử")
    void adjustInventory_WithReasonAndAudit_Success() throws Exception {
        InventoryAdjustRequest request = InventoryAdjustRequest.builder()
                .bookId(book1.getId())
                .quantityChange(-5)
                .transactionType(TransactionType.ADJUSTMENT)
                .note("Kiểm kê cuối tháng phát hiện 5 bản bị ẩm mốc")
                .build();

        mockMvc.perform(post("/api/admin/inventory/adjust")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.quantity").value(45)); // 50 - 5

        // Kiểm tra audit trail
        List<InventoryTransaction> txs = inventoryTransactionRepository.findByBookIdOrderByCreatedAtDesc(book1.getId());
        InventoryTransaction tx = txs.get(0);
        assertEquals(TransactionType.ADJUSTMENT, tx.getTransactionType());
        assertEquals(-5, tx.getQuantityChange());
        assertEquals(45, tx.getRemainingQuantity());
        assertEquals(staffUser.getEmail(), tx.getPerformedBy());
        assertEquals("Kiểm kê cuối tháng phát hiện 5 bản bị ẩm mốc", tx.getNote());
    }

    @Test
    @DisplayName("4. Ngăn số lượng tồn âm khi điều chỉnh vượt quá số lượng hiện có")
    void adjustInventory_NegativeStock_BadRequest() throws Exception {
        // book2 hiện có quantity = 3. Cố tình trừ 10 cuốn
        InventoryAdjustRequest request = InventoryAdjustRequest.builder()
                .bookId(book2.getId())
                .quantityChange(-10)
                .transactionType(TransactionType.ADJUSTMENT)
                .note("Trừ quá mức tồn")
                .build();

        mockMvc.perform(post("/api/admin/inventory/adjust")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("không thể nhỏ hơn 0")));

        // Tồn kho không đổi
        Inventory inv2 = inventoryRepository.findByBookId(book2.getId()).orElseThrow();
        assertEquals(3, inv2.getQuantity());
    }

    @Test
    @DisplayName("5. Cập nhật cấu hình ngưỡng cảnh báo tồn kho thấp (lowStockThreshold)")
    void updateLowStockThreshold_Success() throws Exception {
        InventoryThresholdRequest request = InventoryThresholdRequest.builder()
                .lowStockThreshold(20)
                .build();

        mockMvc.perform(put("/api/admin/inventory/" + book1.getId() + "/threshold")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.lowStockThreshold").value(20));

        Inventory inv1 = inventoryRepository.findByBookId(book1.getId()).orElseThrow();
        assertEquals(20, inv1.getLowStockThreshold());

        // Kiểm tra ngưỡng âm bị chặn validation
        InventoryThresholdRequest invalidReq = InventoryThresholdRequest.builder()
                .lowStockThreshold(-1)
                .build();

        mockMvc.perform(put("/api/admin/inventory/" + book1.getId() + "/threshold")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6. Kiểm soát cập nhật đồng thời (Concurrency Control): Không bán vượt số lượng tồn")
    void concurrentOrders_PreventOverselling_PessimisticLock() throws Exception {
        // Tạo 1 cuốn sách chỉ có 2 bản tồn kho
        Book scarceBook = bookRepository.save(Book.builder()
                .title("Sách Hiếm Giới Hạn")
                .slug("sach-hiem-" + UUID.randomUUID())
                .isbn("978" + UUID.randomUUID().toString().replace("-", "").substring(0, 10))
                .originalPrice(new BigDecimal("300000.00"))
                .salePrice(new BigDecimal("250000.00"))
                .status(Book.BookStatus.PUBLISHED)
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(scarceBook)
                .quantity(2)
                .reservedQuantity(0)
                .lowStockThreshold(1)
                .build());

        int threads = 5;
        List<User> concurrentCustomers = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            User c = userRepository.save(User.builder()
                    .email("concurrent_cust_" + i + "_" + UUID.randomUUID() + "@novelia.vn")
                    .passwordHash(passwordEncoder.encode("Pass123!"))
                    .fullName("Khách Mua ĐH " + i)
                    .roles(Set.of(customerRole))
                    .build());
            cartService.addToCart(c.getEmail(), new AddToCartRequest(scarceBook.getId(), 1));
            concurrentCustomers.add(c);
        }

        ExecutorService executorService = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threads);

        AtomicInteger successOrders = new AtomicInteger(0);
        AtomicInteger failedOrders = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final User customer = concurrentCustomers.get(i);
            executorService.submit(() -> {
                try {
                    startLatch.await(); // Chờ tất cả luồng sẵn sàng xuất phát cùng 1 tích tắc

                    CreateOrderRequest req = CreateOrderRequest.builder()
                            .receiverName(customer.getFullName())
                            .receiverPhone("0912345678")
                            .detailedAddress("123 Phố Sách Hà Nội")
                            .province("Hà Nội")
                            .district("Hoàn Kiếm")
                            .ward("Tràng Tiền")
                            .paymentMethod("COD")
                            .build();

                    orderService.createOrder(customer.getEmail(), req);
                    successOrders.incrementAndGet();
                } catch (Exception e) {
                    failedOrders.incrementAndGet();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Bắn pháo lệnh cho 5 luồng cùng chạy
        boolean finishedInTime = finishLatch.await(10, TimeUnit.SECONDS);
        executorService.shutdown();

        assertTrue(finishedInTime, "Các giao dịch đồng thời phải kết thúc trong vòng 10 giây");

        // Kiểm tra: Vì kho chỉ có 2 cuốn, chỉ tối đa 2 đơn thành công, các đơn còn lại phải bị từ chối
        assertEquals(2, successOrders.get(), "Chỉ đúng 2 đơn hàng được phép thành công ứng với 2 cuốn tồn kho");
        assertEquals(3, failedOrders.get(), "3 đơn hàng vượt quá số lượng phải bị từ chối");

        // Tồn kho cuối cùng phải là 0, KHÔNG BAO GIỜ BỊ ÂM
        Inventory finalInv = inventoryRepository.findByBookId(scarceBook.getId()).orElseThrow();
        assertEquals(0, finalInv.getQuantity(), "Tồn kho sau khi bán hết phải về chính xác 0 cuốn");
    }

    @Test
    @DisplayName("7. Hủy đơn hàng hoàn kho an toàn và không bị hoàn kho lặp")
    void cancelOrder_RestoreInventory_NoDuplicateRestoration() throws Exception {
        // Khách thêm 5 cuốn book1 vào giỏ và đặt hàng
        cartService.addToCart(customerUser.getEmail(), new AddToCartRequest(book1.getId(), 5));

        CreateOrderRequest req = CreateOrderRequest.builder()
                .receiverName("Khách Hàng Hủy Đơn")
                .receiverPhone("0911223344")
                .detailedAddress("456 Lê Lợi")
                .province("TP.HCM")
                .district("Quận 1")
                .ward("Bến Nghé")
                .paymentMethod("COD")
                .build();

        OrderResponse orderRes = orderService.createOrder(customerUser.getEmail(), req);

        // Sau khi đặt, tồn kho giảm 5: 50 - 5 = 45
        Inventory invAfterOrder = inventoryRepository.findByBookId(book1.getId()).orElseThrow();
        assertEquals(45, invAfterOrder.getQuantity());

        // Hủy đơn hàng lần 1
        orderService.cancelOrder(customerUser.getEmail(), orderRes.getOrderNumber(), new CancelOrderRequest("Đổi ý không mua nữa"));

        // Tồn kho được hoàn lại 5: 45 + 5 = 50
        Inventory invAfterCancel = inventoryRepository.findByBookId(book1.getId()).orElseThrow();
        assertEquals(50, invAfterCancel.getQuantity());

        // Kiểm tra cờ inventoryRestored = true
        Order cancelledOrder = orderRepository.findByOrderNumber(orderRes.getOrderNumber()).orElseThrow();
        assertTrue(cancelledOrder.getInventoryRestored());

        // Thử hủy lại lần 2: phải bị từ chối và không được cộng dồn kho thêm
        assertThrows(Exception.class, () -> {
            orderService.cancelOrder(customerUser.getEmail(), orderRes.getOrderNumber(), new CancelOrderRequest("Cố hủy lần 2"));
        });

        Inventory finalInv = inventoryRepository.findByBookId(book1.getId()).orElseThrow();
        assertEquals(50, finalInv.getQuantity(), "Tồn kho không được hoàn lặp lần 2");
    }

    @Test
    @DisplayName("8. Phân quyền: Khách hàng thường bị chặn 403 Forbidden, Nhân viên & Admin được phép")
    void rbac_CustomerForbidden_StaffAdminAllowed() throws Exception {
        // Customer cố điều chỉnh kho -> 403
        InventoryAdjustRequest request = InventoryAdjustRequest.builder()
                .bookId(book1.getId())
                .quantityChange(10)
                .transactionType(TransactionType.ADJUSTMENT)
                .note("Khách hàng hack kho")
                .build();

        mockMvc.perform(post("/api/admin/inventory/adjust")
                        .header("Authorization", "Bearer " + customerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        // Customer cố xem summary -> 403
        mockMvc.perform(get("/api/admin/inventory/summary")
                        .header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden());

        // Staff và Admin được phép xem summary -> 200
        mockMvc.perform(get("/api/admin/inventory/summary")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());
    }
}
