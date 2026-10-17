package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.cart.dto.AddToCartRequest;
import com.novelia.cart.dto.UpdateCartItemRequest;
import com.novelia.cart.entity.Cart;
import com.novelia.cart.entity.CartItem;
import com.novelia.cart.repository.CartItemRepository;
import com.novelia.cart.repository.CartRepository;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CartApiTest {

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
    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;

    private User user1;
    private User user2;
    private String user1Jwt;
    private String user2Jwt;

    private Book testBook;
    private final int INITIAL_STOCK = 10;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        user1 = userRepository.save(User.builder()
                .email("cartuser1@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("User One")
                .roles(Set.of(customerRole))
                .build());
        UsernamePasswordAuthenticationToken auth1 = new UsernamePasswordAuthenticationToken(
                user1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        user1Jwt = tokenProvider.generateTokenFromUsername(user1.getEmail(), auth1);

        user2 = userRepository.save(User.builder()
                .email("cartuser2@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("User Two")
                .roles(Set.of(customerRole))
                .build());
        UsernamePasswordAuthenticationToken auth2 = new UsernamePasswordAuthenticationToken(
                user2.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        user2Jwt = tokenProvider.generateTokenFromUsername(user2.getEmail(), auth2);

        Author author = authorRepository.save(Author.builder()
                .name("Tác Giả Kiểm Thử")
                .slug("tac-gia-kiem-thu-cart")
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Thể Loại Kiểm Thử")
                .slug("the-loai-kiem-thu-cart")
                .build());

        testBook = bookRepository.save(Book.builder()
                .title("Sách Kiểm Thử Giỏ Hàng")
                .slug("sach-kiem-thu-gio-hang")
                .isbn("9786045639999")
                .originalPrice(new BigDecimal("150000.00"))
                .salePrice(new BigDecimal("120000.00"))
                .status(Book.BookStatus.PUBLISHED)
                .authors(Set.of(author))
                .categories(Set.of(category))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(testBook)
                .quantity(INITIAL_STOCK)
                .reservedQuantity(0)
                .build());
    }

    @Test
    @DisplayName("Lấy giỏ hàng lần đầu: Tự động khởi tạo giỏ hàng trống thành công")
    void testGetEmptyCart() throws Exception {
        mockMvc.perform(get("/api/cart")
                .header("Authorization", "Bearer " + user1Jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.subtotal").value(0));
    }

    @Test
    @DisplayName("Thêm sách vào giỏ thành công và tính đúng thành tiền")
    void testAddToCartSuccess() throws Exception {
        AddToCartRequest request = AddToCartRequest.builder()
                .bookId(testBook.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/cart/items")
                .header("Authorization", "Bearer " + user1Jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(2))
                .andExpect(jsonPath("$.data.items[0].bookId").value(testBook.getId()))
                .andExpect(jsonPath("$.data.items[0].unitPrice").value(120000.0))
                .andExpect(jsonPath("$.data.items[0].totalPrice").value(240000.0)) // 120k * 2 = 240k
                .andExpect(jsonPath("$.data.subtotal").value(240000.0));
    }

    @Test
    @DisplayName("Thêm cùng một cuốn sách: Tự động cộng dồn số lượng và cập nhật tổng tiền")
    void testAddToCartCumulative() throws Exception {
        AddToCartRequest req1 = AddToCartRequest.builder().bookId(testBook.getId()).quantity(2).build();
        AddToCartRequest req2 = AddToCartRequest.builder().bookId(testBook.getId()).quantity(3).build();

        mockMvc.perform(post("/api/cart/items")
                .header("Authorization", "Bearer " + user1Jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/cart/items")
                .header("Authorization", "Bearer " + user1Jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.totalItems").value(5))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.subtotal").value(600000.0)); // 120k * 5 = 600k
    }

    @Test
    @DisplayName("Thêm số lượng vượt quá tồn kho: Trả về 400 Bad Request")
    void testAddToCartExceedStock() throws Exception {
        AddToCartRequest request = AddToCartRequest.builder()
                .bookId(testBook.getId())
                .quantity(INITIAL_STOCK + 5) // 15 > 10
                .build();

        mockMvc.perform(post("/api/cart/items")
                .header("Authorization", "Bearer " + user1Jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("vượt quá số lượng tồn kho khả dụng")));
    }

    @Test
    @DisplayName("Cập nhật số lượng trong giỏ hàng thành công")
    void testUpdateCartItemQuantitySuccess() throws Exception {
        Cart cart = cartRepository.save(Cart.builder().user(user1).build());
        CartItem cartItem = cartItemRepository.save(CartItem.builder()
                .cart(cart)
                .book(testBook)
                .quantity(1)
                .build());

        UpdateCartItemRequest updateReq = UpdateCartItemRequest.builder().quantity(4).build();

        mockMvc.perform(put("/api/cart/items/" + cartItem.getId())
                .header("Authorization", "Bearer " + user1Jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(4))
                .andExpect(jsonPath("$.data.subtotal").value(480000.0)); // 120k * 4
    }

    @Test
    @DisplayName("Xóa sản phẩm khỏi giỏ hàng thành công")
    void testRemoveCartItemSuccess() throws Exception {
        Cart cart = cartRepository.save(Cart.builder().user(user1).build());
        CartItem cartItem = cartItemRepository.save(CartItem.builder()
                .cart(cart)
                .book(testBook)
                .quantity(2)
                .build());

        mockMvc.perform(delete("/api/cart/items/" + cartItem.getId())
                .header("Authorization", "Bearer " + user1Jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.subtotal").value(0.0));
    }

    @Test
    @DisplayName("Làm trống giỏ hàng thành công")
    void testClearCartSuccess() throws Exception {
        Cart cart = cartRepository.save(Cart.builder().user(user1).build());
        cartItemRepository.save(CartItem.builder().cart(cart).book(testBook).quantity(2).build());

        mockMvc.perform(delete("/api/cart")
                .header("Authorization", "Bearer " + user1Jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalItems").value(0));
    }

    @Test
    @DisplayName("Bảo mật & Phân quyền: Ngăn chặn User 2 chỉnh sửa hoặc xóa CartItem của User 1 (403 Forbidden)")
    void testPreventAccessToAnotherUsersCartItem() throws Exception {
        // Create Cart and CartItem for User 1
        Cart cart1 = cartRepository.save(Cart.builder().user(user1).build());
        CartItem itemOfUser1 = cartItemRepository.save(CartItem.builder()
                .cart(cart1)
                .book(testBook)
                .quantity(1)
                .build());

        UpdateCartItemRequest updateReq = UpdateCartItemRequest.builder().quantity(3).build();

        // User 2 attempts to modify User 1's cart item -> 403 Forbidden
        mockMvc.perform(put("/api/cart/items/" + itemOfUser1.getId())
                .header("Authorization", "Bearer " + user2Jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Bạn không có quyền")));

        // User 2 attempts to delete User 1's cart item -> 403 Forbidden
        mockMvc.perform(delete("/api/cart/items/" + itemOfUser1.getId())
                .header("Authorization", "Bearer " + user2Jwt))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Chưa đăng nhập: Truy cập giỏ hàng trả về 401 Unauthorized")
    void testCartUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
