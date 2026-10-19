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
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.entity.InventoryTransaction;
import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.inventory.repository.InventoryTransactionRepository;
import com.novelia.order.dto.CreateOrderRequest;
import com.novelia.security.JwtTokenProvider;
import com.novelia.user.entity.Address;
import com.novelia.user.entity.Role;
import com.novelia.user.entity.User;
import com.novelia.user.repository.AddressRepository;
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
class OrderApiTest {

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
    @Autowired private CartService cartService;
    @Autowired private AddressRepository addressRepository;
    @Autowired private InventoryTransactionRepository inventoryTransactionRepository;

    private User user1;
    private User user2;
    private String user1Jwt;
    private String user2Jwt;

    private Book testBook;
    private final int INITIAL_STOCK = 20;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        user1 = userRepository.save(User.builder()
                .email("orderuser1@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Nguyễn Văn A")
                .phone("0901234567")
                .roles(Set.of(customerRole))
                .build());
        UsernamePasswordAuthenticationToken auth1 = new UsernamePasswordAuthenticationToken(
                user1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        user1Jwt = tokenProvider.generateTokenFromUsername(user1.getEmail(), auth1);

        user2 = userRepository.save(User.builder()
                .email("orderuser2@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Trần Thị B")
                .phone("0987654321")
                .roles(Set.of(customerRole))
                .build());
        UsernamePasswordAuthenticationToken auth2 = new UsernamePasswordAuthenticationToken(
                user2.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        user2Jwt = tokenProvider.generateTokenFromUsername(user2.getEmail(), auth2);

        Author author = authorRepository.save(Author.builder()
                .name("Haruki Murakami")
                .slug("haruki-murakami-order-test-" + UUID.randomUUID())
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Văn Học Nhật Bản")
                .slug("van-hoc-nhat-ban-order-test-" + UUID.randomUUID())
                .build());

        testBook = bookRepository.save(Book.builder()
                .title("Rừng Na Uy Tuyển Tập")
                .slug("rung-na-uy-tuyen-tap-" + UUID.randomUUID())
                .isbn("978604" + (System.currentTimeMillis() % 10000000))
                .originalPrice(new BigDecimal("150000"))
                .salePrice(new BigDecimal("135000"))
                .authors(Set.of(author))
                .categories(Set.of(category))
                .coverImage("https://images.unsplash.com/photo-1544947950-fa07a98d237f")
                .build());

        Inventory inventory = inventoryRepository.save(Inventory.builder()
                .book(testBook)
                .quantity(INITIAL_STOCK)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build());
    }

    @Test
    @DisplayName("Xem tóm tắt đơn hàng khi giỏ hàng có sản phẩm")
    void getCheckoutSummary_Success() throws Exception {
        // Thêm 2 cuốn sách vào giỏ: 2 * 135.000 = 270.000đ (< 500k => phí ship 30.000đ)
        cartService.addToCart(user1.getEmail(), new AddToCartRequest(testBook.getId(), 2));

        mockMvc.perform(get("/api/orders/checkout-summary")
                        .header("Authorization", "Bearer " + user1Jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].bookTitle").value("Rừng Na Uy Tuyển Tập"))
                .andExpect(jsonPath("$.data.items[0].unitPrice").value(135000))
                .andExpect(jsonPath("$.data.items[0].quantity").value(2))
                .andExpect(jsonPath("$.data.subtotal").value(270000))
                .andExpect(jsonPath("$.data.shippingFee").value(30000))
                .andExpect(jsonPath("$.data.totalAmount").value(300000));
    }

    @Test
    @DisplayName("Đặt hàng COD thành công với thông tin địa chỉ mới, trừ kho, ghi log và xóa giỏ")
    void createOrder_Success_WithNewAddress() throws Exception {
        // Thêm 3 cuốn vào giỏ
        cartService.addToCart(user1.getEmail(), new AddToCartRequest(testBook.getId(), 3));

        CreateOrderRequest request = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn A")
                .receiverPhone("0901234567")
                .detailedAddress("123 Lê Lợi, Phường Bến Nghé")
                .province("Thành phố Hồ Chí Minh")
                .district("Quận 1")
                .ward("Phường Bến Nghé")
                .paymentMethod("COD")
                .note("Giao giờ hành chính")
                .idempotencyKey(UUID.randomUUID().toString())
                .build();

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + user1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber", startsWith("NOV-")))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.paymentMethod").value("COD"))
                .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"))
                .andExpect(jsonPath("$.data.subtotal").value(405000)) // 3 * 135000
                .andExpect(jsonPath("$.data.shippingFee").value(30000))
                .andExpect(jsonPath("$.data.totalAmount").value(435000))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].bookTitle").value("Rừng Na Uy Tuyển Tập"))
                .andExpect(jsonPath("$.data.items[0].price").value(135000))
                .andExpect(jsonPath("$.data.items[0].quantity").value(3));

        // Kiểm tra tồn kho đã bị trừ an toàn: 20 - 3 = 17
        Inventory updatedInventory = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        assertEquals(INITIAL_STOCK - 3, updatedInventory.getAvailableQuantity());
        assertEquals(INITIAL_STOCK - 3, updatedInventory.getQuantity());

        // Kiểm tra log giao dịch kho
        List<InventoryTransaction> txs = inventoryTransactionRepository.findByBookIdOrderByCreatedAtDesc(testBook.getId());
        assertFalse(txs.isEmpty());
        assertEquals(TransactionType.SALE, txs.get(0).getTransactionType());
        assertEquals(-3, txs.get(0).getQuantityChange());

        // Kiểm tra giỏ hàng của user1 đã bị xóa sạch sau khi đặt hàng
        var cart = cartService.getMyCart(user1.getEmail());
        assertEquals(0, cart.getTotalItems());
        assertTrue(cart.getItems().isEmpty());
    }

    @Test
    @DisplayName("Đặt hàng thành công với addressId đã lưu của chính mình")
    void createOrder_Success_WithSavedAddress() throws Exception {
        // Lưu địa chỉ cho user1
        Address address = addressRepository.save(Address.builder()
                .user(user1)
                .receiverName("Nguyễn Văn A Nhà Riêng")
                .phone("0901234567")
                .detailedAddress("456 Hai Bà Trưng")
                .province("Hà Nội")
                .district("Hoàn Kiếm")
                .ward("Tràng Tiền")
                .isDefault(true)
                .build());

        cartService.addToCart(user1.getEmail(), new AddToCartRequest(testBook.getId(), 1));

        CreateOrderRequest request = CreateOrderRequest.builder()
                .addressId(address.getId())
                .paymentMethod("COD")
                .idempotencyKey(UUID.randomUUID().toString())
                .build();

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + user1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.shippingAddress", containsString("456 Hai Bà Trưng")));
    }

    @Test
    @DisplayName("Không cho phép đặt hàng bằng địa chỉ của người khác (403 Forbidden)")
    void createOrder_Forbidden_WhenUsingOtherUserAddress() throws Exception {
        // Địa chỉ thuộc về user2
        Address user2Address = addressRepository.save(Address.builder()
                .user(user2)
                .receiverName("Trần Thị B")
                .phone("0987654321")
                .detailedAddress("789 Trần Hưng Đạo")
                .province("Đà Nẵng")
                .district("Hải Châu")
                .ward("Hải Châu 1")
                .isDefault(true)
                .build());

        // User1 cố tình đặt hàng dùng addressId của user2
        cartService.addToCart(user1.getEmail(), new AddToCartRequest(testBook.getId(), 1));

        CreateOrderRequest request = CreateOrderRequest.builder()
                .addressId(user2Address.getId())
                .paymentMethod("COD")
                .build();

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + user1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Chặn đặt hàng khi giỏ hàng trống (400 Bad Request)")
    void createOrder_BadRequest_WhenCartIsEmpty() throws Exception {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn A")
                .receiverPhone("0901234567")
                .detailedAddress("123 Lê Lợi")
                .province("TP HCM")
                .district("Quận 1")
                .ward("Bến Nghé")
                .paymentMethod("COD")
                .build();

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + user1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("trống")));
    }

    @Test
    @DisplayName("Kiểm tra hết hàng: rollback transaction và không trừ kho khi tồn kho không đủ")
    void createOrder_Rollback_WhenStockInsufficient() throws Exception {
        cartService.addToCart(user1.getEmail(), new AddToCartRequest(testBook.getId(), 5));

        // Đột ngột tồn kho bị giảm chỉ còn 2 cuốn
        Inventory inv = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        inv.setQuantity(2);
        inv.setReservedQuantity(0);
        inventoryRepository.save(inv);

        CreateOrderRequest request = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn A")
                .receiverPhone("0901234567")
                .detailedAddress("123 Lê Lợi")
                .province("TP HCM")
                .district("Quận 1")
                .ward("Bến Nghé")
                .paymentMethod("COD")
                .build();

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + user1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("cuốn")));

        // Tồn kho không thay đổi, vẫn là 2
        Inventory rollbackInv = inventoryRepository.findByBookId(testBook.getId()).orElseThrow();
        assertEquals(2, rollbackInv.getAvailableQuantity());
    }

    @Test
    @DisplayName("Idempotency: không tạo 2 đơn hàng khi gửi lại cùng idempotencyKey")
    void createOrder_Idempotency_PreventDuplicateOrder() throws Exception {
        cartService.addToCart(user1.getEmail(), new AddToCartRequest(testBook.getId(), 1));

        String idempotencyKey = "unique-key-" + UUID.randomUUID();
        CreateOrderRequest request = CreateOrderRequest.builder()
                .receiverName("Nguyễn Văn A")
                .receiverPhone("0901234567")
                .detailedAddress("123 Lê Lợi")
                .province("TP HCM")
                .district("Quận 1")
                .ward("Bến Nghé")
                .paymentMethod("COD")
                .idempotencyKey(idempotencyKey)
                .build();

        // Lần gọi 1
        String resp1 = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + user1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // Lần gọi 2 với cùng key (retry)
        String resp2 = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + user1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // Cả 2 đều trả về cùng 1 mã đơn hàng
        String orderNum1 = objectMapper.readTree(resp1).path("data").path("orderNumber").asText();
        String orderNum2 = objectMapper.readTree(resp2).path("data").path("orderNumber").asText();
        assertEquals(orderNum1, orderNum2);
    }

    @Test
    @DisplayName("Chặn truy cập API đơn hàng khi chưa xác thực (401 Unauthorized)")
    void orderEndpoints_Unauthorized_WithoutToken() throws Exception {
        mockMvc.perform(get("/api/orders/checkout-summary"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
