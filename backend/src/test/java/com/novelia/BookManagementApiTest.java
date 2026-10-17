package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.author.dto.AuthorRequest;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.dto.BookCreateRequest;
import com.novelia.book.dto.BookUpdateRequest;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.dto.CategoryRequest;
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

import com.novelia.order.entity.Order;
import com.novelia.order.entity.OrderItem;
import com.novelia.order.repository.OrderItemRepository;
import com.novelia.order.repository.OrderRepository;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BookManagementApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private BookRepository bookRepository;
    @Autowired private AuthorRepository authorRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;

    private Role customerRole;
    private Role staffRole;
    private Role adminRole;

    private String customerJwt;
    private String staffJwt;
    private String adminJwt;

    private Author testAuthor;
    private Category testCategory;
    private Book testBook1;
    private Book testBook2;

    @BeforeEach
    void setUp() {
        customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));
        staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Staff").build()));
        adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));

        // Create test users and tokens
        User customerUser = userRepository.save(User.builder()
                .email("testcustomer@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Test Customer")
                .roles(Set.of(customerRole))
                .build());
        UsernamePasswordAuthenticationToken customerAuth = new UsernamePasswordAuthenticationToken(
                customerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        customerJwt = tokenProvider.generateTokenFromUsername(customerUser.getEmail(), customerAuth);

        User staffUser = userRepository.save(User.builder()
                .email("teststaff@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Test Staff")
                .roles(Set.of(staffRole))
                .build());
        UsernamePasswordAuthenticationToken staffAuth = new UsernamePasswordAuthenticationToken(
                staffUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        staffJwt = tokenProvider.generateTokenFromUsername(staffUser.getEmail(), staffAuth);

        User adminUser = userRepository.save(User.builder()
                .email("testadmin@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Test Admin")
                .roles(Set.of(adminRole))
                .build());
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        adminJwt = tokenProvider.generateTokenFromUsername(adminUser.getEmail(), adminAuth);

        // Seed sample category and author
        testAuthor = authorRepository.save(Author.builder()
                .name("Haruki Murakami")
                .slug("haruki-murakami-test")
                .nationality("Nhật Bản")
                .biography("Nhà văn nổi tiếng thế giới")
                .build());

        testCategory = categoryRepository.save(Category.builder()
                .name("Văn học Hiện đại")
                .slug("van-hoc-hien-dai-test")
                .description("Các tác phẩm đương đại")
                .isActive(true)
                .displayOrder(1)
                .build());

        testBook1 = bookRepository.save(Book.builder()
                .title("Rừng Na Uy")
                .slug("rung-na-uy-test")
                .isbn("9786045638101")
                .originalPrice(new BigDecimal("150000.00"))
                .salePrice(new BigDecimal("120000.00"))
                .status(Book.BookStatus.PUBLISHED)
                .isFeatured(true)
                .averageRating(new BigDecimal("4.80"))
                .reviewCount(15)
                .authors(new java.util.HashSet<>(Set.of(testAuthor)))
                .categories(new java.util.HashSet<>(Set.of(testCategory)))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(testBook1)
                .quantity(50)
                .reservedQuantity(5)
                .lowStockThreshold(10)
                .build());

        testBook2 = bookRepository.save(Book.builder()
                .title("Biên Niên Ký Chim Vặn Dây Cót")
                .slug("bien-nien-ky-chim-van-day-cot-test")
                .isbn("9786045638102")
                .originalPrice(new BigDecimal("220000.00"))
                .salePrice(new BigDecimal("185000.00"))
                .status(Book.BookStatus.PUBLISHED)
                .isFeatured(false)
                .averageRating(new BigDecimal("4.60"))
                .reviewCount(8)
                .authors(new java.util.HashSet<>(Set.of(testAuthor)))
                .categories(new java.util.HashSet<>(Set.of(testCategory)))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(testBook2)
                .quantity(20)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build());
    }

    @Test
    @DisplayName("Public: Lấy danh sách sách có phân trang trả về 200 OK")
    void testGetBooksPublicWithPagination() throws Exception {
        mockMvc.perform(get("/api/books")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.data.content[0].stockQuantity").isNumber());
    }

    @Test
    @DisplayName("Public: Tìm kiếm sách theo từ khóa tên và ISBN")
    void testSearchBooksByKeywordAndIsbn() throws Exception {
        // Search by title
        mockMvc.perform(get("/api/books")
                .param("keyword", "Rừng Na Uy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Rừng Na Uy"));

        // Search by ISBN
        mockMvc.perform(get("/api/books")
                .param("keyword", "9786045638102"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Biên Niên Ký Chim Vặn Dây Cót"));
    }

    @Test
    @DisplayName("Public: Lọc sách theo danh mục và khoảng giá")
    void testFilterByCategoryAndPriceRange() throws Exception {
        mockMvc.perform(get("/api/books")
                .param("categoryId", testCategory.getId().toString())
                .param("minPrice", "100000")
                .param("maxPrice", "150000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].title").value("Rừng Na Uy"));
    }

    @Test
    @DisplayName("Public: Sắp xếp theo giá tăng dần (price_asc) và giảm dần (price_desc)")
    void testSortBooks() throws Exception {
        // Ascending
        mockMvc.perform(get("/api/books")
                .param("sortBy", "price_asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].salePrice").value(lessThanOrEqualTo(150000.0)));

        // Descending
        mockMvc.perform(get("/api/books")
                .param("sortBy", "price_desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].salePrice").value(greaterThanOrEqualTo(180000.0)));
    }

    @Test
    @DisplayName("Public: Lấy chi tiết sách theo ID và theo Slug")
    void testGetBookDetailByIdAndSlug() throws Exception {
        // By ID
        mockMvc.perform(get("/api/books/" + testBook1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(testBook1.getId()))
                .andExpect(jsonPath("$.data.stockQuantity").value(45)); // 50 - 5 = 45

        // By Slug
        mockMvc.perform(get("/api/books/" + testBook1.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Rừng Na Uy"));
    }

    @Test
    @DisplayName("Validation: Thêm sách giá bán lớn hơn giá bìa trả về 400 Bad Request")
    void testCreateBookInvalidPrice() throws Exception {
        BookCreateRequest request = BookCreateRequest.builder()
                .title("Sách Lỗi Giá")
                .isbn("9786045638999")
                .originalPrice(new BigDecimal("100000"))
                .salePrice(new BigDecimal("150000")) // salePrice > originalPrice
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .build();

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Giá bán không được lớn hơn giá bìa")));
    }

    @Test
    @DisplayName("Validation: Mã ISBN sai chuẩn trả về 400 Bad Request")
    void testCreateBookInvalidIsbn() throws Exception {
        BookCreateRequest request = BookCreateRequest.builder()
                .title("Sách Sai ISBN")
                .isbn("INVALID_ISBN_123")
                .originalPrice(new BigDecimal("100000"))
                .salePrice(new BigDecimal("80000"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .build();

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Phân quyền: CUSTOMER không được phép thêm sách (403 Forbidden)")
    void testCreateBookForbiddenForCustomer() throws Exception {
        BookCreateRequest request = BookCreateRequest.builder()
                .title("Sách Khách Thử Tạo")
                .isbn("9786045638888")
                .originalPrice(new BigDecimal("100000"))
                .salePrice(new BigDecimal("80000"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .build();

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + customerJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Phân quyền & CRUD: ADMIN / STAFF thêm sách thành công (201 Created) và tự động tạo tồn kho")
    void testCreateBookSuccessByStaff() throws Exception {
        BookCreateRequest request = BookCreateRequest.builder()
                .title("Tôi Nói Gì Khi Nói Về Chạy Bộ")
                .isbn("9786045638777")
                .originalPrice(new BigDecimal("110000.00"))
                .salePrice(new BigDecimal("95000.00"))
                .pages(240)
                .publisher("NXB Hội Nhà Văn")
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .initialStock(35)
                .build();

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + staffJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Tôi Nói Gì Khi Nói Về Chạy Bộ"))
                .andExpect(jsonPath("$.data.stockQuantity").value(35));
    }

    @Test
    @DisplayName("CRUD Sách: Cập nhật thông tin và số lượng tồn kho thành công")
    void testUpdateBookSuccess() throws Exception {
        BookUpdateRequest request = BookUpdateRequest.builder()
                .title("Rừng Na Uy - Tái Bản Đặc Biệt")
                .isbn(testBook1.getIsbn())
                .originalPrice(new BigDecimal("180000.00"))
                .salePrice(new BigDecimal("140000.00"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .stockQuantity(100)
                .build();

        mockMvc.perform(put("/api/books/" + testBook1.getId())
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Rừng Na Uy - Tái Bản Đặc Biệt"))
                .andExpect(jsonPath("$.data.stockQuantity").value(95)); // 100 - 5 reserved = 95
    }

    @Test
    @DisplayName("CRUD Danh mục & Tác giả: Thêm mới và quản lý thành công")
    void testCategoryAndAuthorCrud() throws Exception {
        // Create Author
        AuthorRequest authorReq = AuthorRequest.builder()
                .name("Nguyễn Nhật Ánh")
                .nationality("Việt Nam")
                .biography("Nhà văn tuổi thơ")
                .build();

        mockMvc.perform(post("/api/authors")
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authorReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Nguyễn Nhật Ánh"));

        // Create Category
        CategoryRequest catReq = CategoryRequest.builder()
                .name("Tiểu Thuyết Trinh Thám")
                .description("Hồi hộp ly kỳ")
                .build();

        mockMvc.perform(post("/api/categories")
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(catReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Tiểu Thuyết Trinh Thám"));
    }

    @Test
    @DisplayName("Validation: Ngăn tạo sách với mã ISBN đã tồn tại trong database (400 Bad Request)")
    void testDuplicateIsbnOnCreateReturnsBadRequest() throws Exception {
        BookCreateRequest request = BookCreateRequest.builder()
                .title("Tựa Sách Trùng ISBN")
                .isbn(testBook1.getIsbn()) // ISBN của testBook1 đã tồn tại
                .originalPrice(new BigDecimal("120000"))
                .salePrice(new BigDecimal("100000"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .build();

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("đã tồn tại trong hệ thống")));
    }

    @Test
    @DisplayName("Validation: Ngăn cập nhật sách sang mã ISBN của sách khác (400 Bad Request)")
    void testDuplicateIsbnOnUpdateReturnsBadRequest() throws Exception {
        BookUpdateRequest request = BookUpdateRequest.builder()
                .title("Đổi Sang ISBN Trùng")
                .isbn(testBook1.getIsbn()) // Đổi sang ISBN của testBook1
                .originalPrice(new BigDecimal("220000"))
                .salePrice(new BigDecimal("190000"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .build();

        mockMvc.perform(put("/api/books/" + testBook2.getId())
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("đã tồn tại ở sách khác")));
    }

    @Test
    @DisplayName("Validation: Giá âm trả về lỗi 400 Bad Request")
    void testNegativePriceValidation() throws Exception {
        BookCreateRequest request = BookCreateRequest.builder()
                .title("Sách Giá Âm")
                .isbn("9786045638555")
                .originalPrice(new BigDecimal("-50000")) // Giá âm
                .salePrice(new BigDecimal("40000"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .build();

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Validation: Tồn kho âm trả về lỗi 400 Bad Request")
    void testNegativeStockValidation() throws Exception {
        BookCreateRequest request = BookCreateRequest.builder()
                .title("Sách Tồn Kho Âm")
                .isbn("9786045638444")
                .originalPrice(new BigDecimal("100000"))
                .salePrice(new BigDecimal("80000"))
                .authorIds(Set.of(testAuthor.getId()))
                .categoryIds(Set.of(testCategory.getId()))
                .initialStock(-15) // Tồn kho âm
                .build();

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + adminJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Trạng thái: STAFF có thể cập nhật trạng thái sách (PUBLISHED <-> ARCHIVED)")
    void testUpdateBookStatusByStaff() throws Exception {
        mockMvc.perform(patch("/api/books/" + testBook1.getId() + "/status")
                .param("status", "ARCHIVED")
                .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ARCHIVED"));

        Book updated = bookRepository.findById(testBook1.getId()).orElseThrow();
        assertEquals(Book.BookStatus.ARCHIVED, updated.getStatus());
    }

    @Test
    @DisplayName("Quy tắc đơn hàng: Sách có đơn hàng KHÔNG bị xóa cứng mà chuyển sang ARCHIVED")
    void testSoftDeleteWhenBookHasOrders() throws Exception {
        // Tạo một đơn hàng có tham chiếu đến testBook1
        User customer = userRepository.findByEmail("testcustomer@novelia.vn").orElseThrow();
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-TEST-" + System.currentTimeMillis())
                .user(customer)
                .subtotal(new BigDecimal("120000"))
                .totalAmount(new BigDecimal("120000"))
                .status(Order.OrderStatus.CONFIRMED)
                .receiverName("Khách Mua Sách")
                .receiverPhone("0987654321")
                .shippingAddress("123 Phố Sách, Hà Nội")
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .book(testBook1)
                .bookTitle(testBook1.getTitle())
                .price(testBook1.getSalePrice())
                .quantity(1)
                .totalPrice(testBook1.getSalePrice())
                .build());

        // Thực hiện xóa sách
        mockMvc.perform(delete("/api/books/" + testBook1.getId())
                .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(containsString("Lưu trữ")));

        // Sách vẫn còn trong DB nhưng trạng thái là ARCHIVED
        Book bookAfterDelete = bookRepository.findById(testBook1.getId()).orElse(null);
        assertNotNull(bookAfterDelete);
        assertEquals(Book.BookStatus.ARCHIVED, bookAfterDelete.getStatus());
    }

    @Test
    @DisplayName("Quy tắc đơn hàng: Sách KHÔNG có đơn hàng được xóa sạch khỏi cơ sở dữ liệu")
    void testHardDeleteWhenBookHasNoOrders() throws Exception {
        // Tạo một cuốn sách mới hoàn toàn chưa có đơn hàng
        Book freshBook = bookRepository.save(Book.builder()
                .title("Sách Mới Chưa Ai Mua")
                .slug("sach-moi-chua-ai-mua-test")
                .isbn("9786045638333")
                .originalPrice(new BigDecimal("100000"))
                .salePrice(new BigDecimal("80000"))
                .status(Book.BookStatus.PUBLISHED)
                .authors(new java.util.HashSet<>(Set.of(testAuthor)))
                .categories(new java.util.HashSet<>(Set.of(testCategory)))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(freshBook)
                .quantity(10)
                .reservedQuantity(0)
                .lowStockThreshold(2)
                .build());

        // Thực hiện xóa sách
        mockMvc.perform(delete("/api/books/" + freshBook.getId())
                .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(containsString("Đã xóa vĩnh viễn")));

        // Sách không còn tồn tại trong DB
        assertTrue(bookRepository.findById(freshBook.getId()).isEmpty());
    }

    @Test
    @DisplayName("Quản lý ảnh bìa: STAFF tải ảnh JPG hợp lệ thành công (201 Created)")
    void testImageUploadSuccessByStaff() throws Exception {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "test-cover.jpg",
                "image/jpeg",
                "fake-image-binary-content".getBytes()
        );

        mockMvc.perform(multipart("/api/upload/image")
                .file(mockFile)
                .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").value(startsWith("/uploads/books/")))
                .andExpect(jsonPath("$.data.contentType").value("image/jpeg"));
    }

    @Test
    @DisplayName("Quản lý ảnh bìa: Từ chối file sai định dạng (400 Bad Request)")
    void testImageUploadInvalidTypeReturnsBadRequest() throws Exception {
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "fake-pdf-content".getBytes()
        );

        mockMvc.perform(multipart("/api/upload/image")
                .file(invalidFile)
                .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Chỉ chấp nhận ảnh")));
    }

    @Test
    @DisplayName("Quản lý ảnh bìa: Từ chối file vượt quá 5MB (400 Bad Request)")
    void testImageUploadOversizedReturnsBadRequest() throws Exception {
        byte[] oversizedBytes = new byte[6 * 1024 * 1024]; // 6MB
        MockMultipartFile oversizedFile = new MockMultipartFile(
                "file",
                "huge-cover.png",
                "image/png",
                oversizedBytes
        );

        mockMvc.perform(multipart("/api/upload/image")
                .file(oversizedFile)
                .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("vượt quá 5MB")));
    }

    @Test
    @DisplayName("Phân quyền: CUSTOMER không được phép upload ảnh bìa (403 Forbidden)")
    void testImageUploadForbiddenForCustomer() throws Exception {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "cover.jpg",
                "image/jpeg",
                "image-data".getBytes()
        );

        mockMvc.perform(multipart("/api/upload/image")
                .file(mockFile)
                .header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Quan hệ dữ liệu: Không thể xóa Danh mục đang có sách liên kết (400 Bad Request)")
    void testCannotDeleteCategoryWithBooks() throws Exception {
        mockMvc.perform(delete("/api/categories/" + testCategory.getId())
                .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Không thể xóa danh mục đang có")));
    }

    @Test
    @DisplayName("Quan hệ dữ liệu: Không thể xóa Tác giả đang có sách liên kết (400 Bad Request)")
    void testCannotDeleteAuthorWithBooks() throws Exception {
        mockMvc.perform(delete("/api/authors/" + testAuthor.getId())
                .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Không thể xóa tác giả đang có")));
    }
}
