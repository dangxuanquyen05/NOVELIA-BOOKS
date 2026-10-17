package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.coupon.dto.CreateCouponRequest;
import com.novelia.coupon.dto.UpdateCouponRequest;
import com.novelia.coupon.dto.ValidateCouponRequest;
import com.novelia.coupon.entity.Coupon;
import com.novelia.coupon.repository.CouponRepository;
import com.novelia.coupon.service.CouponService;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.OrderItem;
import com.novelia.order.repository.OrderItemRepository;
import com.novelia.order.repository.OrderRepository;
import com.novelia.review.dto.CreateReviewRequest;
import com.novelia.review.dto.ModerateReviewRequest;
import com.novelia.review.entity.Review;
import com.novelia.review.repository.ReviewRepository;
import com.novelia.review.service.ReviewService;
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
class PromotionAndReviewApiTest {

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
    @Autowired private CouponService couponService;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private ReviewService reviewService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;

    private User admin;
    private User staff;
    private User customer1;
    private User customer2;

    private String adminJwt;
    private String staffJwt;
    private String customer1Jwt;
    private String customer2Jwt;

    private Book testBook;
    private Coupon percentCoupon;
    private Coupon fixedCoupon;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Admin").build()));
        Role staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_STAFF").description("Staff").build()));
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Customer").build()));

        admin = userRepository.save(User.builder()
                .email("promo_admin_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Quản Trị Khuyến Mãi")
                .phone("0971000111")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(adminRole)))
                .build());

        staff = userRepository.save(User.builder()
                .email("promo_staff_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Nhân Viên Kiểm Duyệt")
                .phone("0972000222")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(staffRole)))
                .build());

        customer1 = userRepository.save(User.builder()
                .email("promo_cust1_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Độc Giả Thân Thiết")
                .phone("0973000333")
                .status(User.UserStatus.ACTIVE)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build());

        customer2 = userRepository.save(User.builder()
                .email("promo_cust2_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .fullName("Độc Giả Mới")
                .phone("0974000444")
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

        Author author = authorRepository.save(Author.builder()
                .name("Tác Giả Giai Đoạn 7")
                .slug("tac-gia-gd7-" + UUID.randomUUID())
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Thể Loại GD7")
                .slug("the-loai-gd7-" + UUID.randomUUID())
                .build());

        testBook = bookRepository.save(Book.builder()
                .title("Tác Phẩm Thử Nghiệm GD7")
                .slug("tac-pham-thu-nghiem-gd7-" + UUID.randomUUID())
                .isbn("978" + (System.currentTimeMillis() % 10000000000L))
                .originalPrice(new BigDecimal("200000"))
                .salePrice(new BigDecimal("180000"))
                .averageRating(BigDecimal.ZERO)
                .reviewCount(0)
                .status(Book.BookStatus.PUBLISHED)
                .authors(new HashSet<>(Set.of(author)))
                .categories(new HashSet<>(Set.of(category)))
                .build());

        inventoryRepository.save(Inventory.builder()
                .book(testBook)
                .quantity(100)
                .reservedQuantity(0)
                .lowStockThreshold(10)
                .build());

        // Coupon giảm 20% tối đa 50k, đơn tối thiểu 100k
        percentCoupon = couponRepository.save(Coupon.builder()
                .code("DISCOUNT20")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("20"))
                .minOrderValue(new BigDecimal("100000"))
                .maxDiscountAmount(new BigDecimal("50000"))
                .usageLimit(10)
                .usageLimitPerUser(1)
                .usedCount(0)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .isActive(true)
                .build());

        // Coupon giảm cố định 30,000 VND
        fixedCoupon = couponRepository.save(Coupon.builder()
                .code("FIXED30K")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("30000"))
                .minOrderValue(new BigDecimal("50000"))
                .usageLimit(5)
                .usageLimitPerUser(2)
                .usedCount(0)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .isActive(true)
                .build());
    }

    private Order createDeliveredOrder(User user, Book book, int quantity) {
        BigDecimal total = book.getSalePrice().multiply(BigDecimal.valueOf(quantity));
        Order order = Order.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .user(user)
                .status(Order.OrderStatus.DELIVERED)
                .subtotal(total)
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(total)
                .receiverName(user.getFullName())
                .receiverPhone(user.getPhone())
                .shippingAddress("123 Phố Sách, Hà Nội")
                .items(new ArrayList<>())
                .build();

        Order saved = orderRepository.save(order);
        OrderItem item = OrderItem.builder()
                .order(saved)
                .book(book)
                .bookTitle(book.getTitle())
                .price(book.getSalePrice())
                .quantity(quantity)
                .totalPrice(total)
                .build();
        orderItemRepository.save(item);
        saved.getItems().add(item);
        return saved;
    }

    // =========================================================================
    // 1. KIỂM THỬ KHUYẾN MÃI (COUPONS)
    // =========================================================================

    @Test
    @DisplayName("Áp dụng mã giảm giá phần trăm có chặn trần tối đa (Max Discount Cap)")
    void testValidateCoupon_PercentageWithCap() throws Exception {
        // Đơn 300,000: 20% là 60,000 nhưng trần maxDiscountAmount là 50,000 -> Giảm 50,000
        ValidateCouponRequest req = new ValidateCouponRequest("DISCOUNT20", new BigDecimal("300000"));

        mockMvc.perform(post("/api/coupons/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.discountAmount").value(50000.0))
                .andExpect(jsonPath("$.data.finalAmount").value(250000.0));
    }

    @Test
    @DisplayName("Áp dụng mã giảm giá không cho phép tổng tiền sau giảm bị âm")
    void testValidateCoupon_CannotResultInNegativeTotal() throws Exception {
        // Tạo coupon giảm cố định 500,000 VND
        Coupon hugeCoupon = couponRepository.save(Coupon.builder()
                .code("BIGSALE500K")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("500000"))
                .minOrderValue(BigDecimal.ZERO)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build());

        // Đơn chỉ có 150,000 VND -> Giảm tối đa 150,000, số tiền thanh toán còn 0 VND, không bị âm!
        ValidateCouponRequest req = new ValidateCouponRequest(hugeCoupon.getCode(), new BigDecimal("150000"));

        mockMvc.perform(post("/api/coupons/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.discountAmount").value(150000.0))
                .andExpect(jsonPath("$.data.finalAmount").value(0.0));
    }

    @Test
    @DisplayName("Từ chối mã giảm giá khi đơn hàng chưa đạt giá trị tối thiểu (minOrderValue)")
    void testValidateCoupon_BelowMinOrderValue_Rejected() throws Exception {
        // DISCOUNT20 yêu cầu đơn tối thiểu 100,000; đơn chỉ có 80,000
        ValidateCouponRequest req = new ValidateCouponRequest("DISCOUNT20", new BigDecimal("80000"));

        mockMvc.perform(post("/api/coupons/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.message", containsString("chưa đạt giá trị tối thiểu")));
    }

    @Test
    @DisplayName("Từ chối mã giảm giá đã hết hạn sử dụng hoặc chưa bắt đầu")
    void testValidateCoupon_ExpiredOrNotStarted_Rejected() throws Exception {
        // Coupon hết hạn
        Coupon expired = couponRepository.save(Coupon.builder()
                .code("EXPIREDCODE")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("20000"))
                .startDate(LocalDateTime.now().minusDays(10))
                .endDate(LocalDateTime.now().minusDays(1))
                .isActive(true)
                .build());

        ValidateCouponRequest req = new ValidateCouponRequest(expired.getCode(), new BigDecimal("200000"));

        mockMvc.perform(post("/api/coupons/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.message", containsString("hết hạn sử dụng")));
    }

    @Test
    @DisplayName("Từ chối mã giảm giá khi đã đạt giới hạn sử dụng tối đa của chương trình (usageLimit)")
    void testValidateCoupon_UsageLimitExceeded_Rejected() throws Exception {
        percentCoupon.setUsedCount(percentCoupon.getUsageLimit()); // 10/10
        couponRepository.save(percentCoupon);

        ValidateCouponRequest req = new ValidateCouponRequest("DISCOUNT20", new BigDecimal("200000"));

        mockMvc.perform(post("/api/coupons/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.message", containsString("số lượt sử dụng tối đa")));
    }

    @Test
    @DisplayName("Kiểm soát giới hạn lượt dùng mỗi khách hàng (usageLimitPerUser)")
    void testValidateCoupon_PerUserUsageLimit_Enforced() throws Exception {
        // Tạo đơn hàng đã sử dụng mã DISCOUNT20 cho customer1
        Order order = Order.builder()
                .orderNumber("ORD-USER-COUPON-TEST")
                .user(customer1)
                .status(Order.OrderStatus.CONFIRMED)
                .subtotal(new BigDecimal("200000"))
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(new BigDecimal("40000"))
                .couponCode("DISCOUNT20")
                .totalAmount(new BigDecimal("160000"))
                .receiverName(customer1.getFullName())
                .receiverPhone(customer1.getPhone())
                .shippingAddress("123 HN")
                .build();
        orderRepository.save(order);

        // Customer1 thử áp dụng lại DISCOUNT20 (usageLimitPerUser = 1) -> Bị từ chối
        ValidateCouponRequest req = new ValidateCouponRequest("DISCOUNT20", new BigDecimal("200000"));

        mockMvc.perform(post("/api/coupons/validate")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.message", containsString("hết số lượt cho phép (1 lần)")));

        // Nhưng customer2 chưa dùng bao giờ -> Áp dụng thành công!
        mockMvc.perform(post("/api/coupons/validate")
                        .header("Authorization", "Bearer " + customer2Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(true));
    }

    @Test
    @DisplayName("Admin/Staff quản trị mã: Tạo, sửa, tạm dừng và kết thúc đợt khuyến mãi ngay lập tức")
    void testAdminCouponManagementFlow() throws Exception {
        // 1. Tạo mã mới
        CreateCouponRequest createReq = CreateCouponRequest.builder()
                .code("SPRING2026")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("15"))
                .minOrderValue(new BigDecimal("150000"))
                .maxDiscountAmount(new BigDecimal("40000"))
                .usageLimit(100)
                .usageLimitPerUser(1)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusMonths(1))
                .isActive(true)
                .build();

        String resJson = mockMvc.perform(post("/api/admin/coupons")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("SPRING2026"))
                .andReturn().getResponse().getContentAsString();

        Long couponId = objectMapper.readTree(resJson).path("data").path("id").asLong();

        // 2. Tạm dừng mã (Toggle status)
        mockMvc.perform(patch("/api/admin/coupons/" + couponId + "/toggle")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());

        Coupon toggled = couponRepository.findById(couponId).orElseThrow();
        assertFalse(toggled.getIsActive());

        // 3. Kết thúc đợt khuyến mãi ngay lập tức (Terminate)
        mockMvc.perform(patch("/api/admin/coupons/" + couponId + "/terminate")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk());

        Coupon terminated = couponRepository.findById(couponId).orElseThrow();
        assertFalse(terminated.getIsActive());
        assertTrue(terminated.getEndDate().isBefore(LocalDateTime.now().plusSeconds(5)));
    }

    // =========================================================================
    // 2. KIỂM THỬ ĐÁNH GIÁ SÁCH (REVIEWS)
    // =========================================================================

    @Test
    @DisplayName("Xác thực người mua thật: Từ chối đánh giá nếu chưa từng mua hoặc đơn chưa DELIVERED")
    void testCreateReview_UnverifiedPurchase_Rejected() throws Exception {
        // Customer 2 chưa từng mua testBook
        CreateReviewRequest req = CreateReviewRequest.builder()
                .rating(5)
                .comment("Sách rất hay và giao nhanh!")
                .build();

        mockMvc.perform(post("/api/books/" + testBook.getId() + "/reviews")
                        .header("Authorization", "Bearer " + customer2Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("chỉ có thể đánh giá những tác phẩm đã mua và nhận hàng thành công")));
    }

    @Test
    @DisplayName("Xác thực người mua thật: Đã mua và nhận hàng thành công (DELIVERED) -> Gửi đánh giá PENDING thành công")
    void testCreateReview_VerifiedPurchaser_Success() throws Exception {
        // Tạo đơn hàng DELIVERED chứa testBook cho customer 1
        createDeliveredOrder(customer1, testBook, 1);

        CreateReviewRequest req = CreateReviewRequest.builder()
                .rating(5)
                .comment("Tác phẩm xuất sắc, bìa đẹp và nội dung sâu sắc.")
                .build();

        mockMvc.perform(post("/api/books/" + testBook.getId() + "/reviews")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.isApproved").value(false))
                .andExpect(jsonPath("$.data.isVerifiedPurchase").value(true));
    }

    @Test
    @DisplayName("Chính sách hiển thị: Đánh giá PENDING không hiển thị công khai, chỉ hiển thị sau khi được APPROVED")
    void testPublicBookReviews_OnlyApprovedVisible() throws Exception {
        createDeliveredOrder(customer1, testBook, 1);

        // Tạo review PENDING
        Review review = reviewRepository.save(Review.builder()
                .book(testBook)
                .user(customer1)
                .rating(5)
                .comment("Chờ ban quản trị duyệt...")
                .status(Review.ReviewStatus.PENDING)
                .isApproved(false)
                .isVerifiedPurchase(true)
                .build());

        // API công khai của cuốn sách -> Không thấy review PENDING
        mockMvc.perform(get("/api/books/" + testBook.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));

        // Staff duyệt đánh giá (APPROVED)
        ModerateReviewRequest modReq = ModerateReviewRequest.builder()
                .status(Review.ReviewStatus.APPROVED)
                .build();

        mockMvc.perform(put("/api/admin/reviews/" + review.getId() + "/moderate")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.isApproved").value(true));

        // Bây giờ API công khai đã nhìn thấy review APPROVED
        mockMvc.perform(get("/api/books/" + testBook.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].comment").value("Chờ ban quản trị duyệt..."))
                .andExpect(jsonPath("$.data.content[0].isVerifiedPurchase").value(true));
    }

    @Test
    @DisplayName("Từ chối kiểm duyệt (REJECTED) yêu cầu bắt buộc phải có lý do từ chối (rejectionReason)")
    void testModerateReview_RejectRequiresReason() throws Exception {
        Review review = reviewRepository.save(Review.builder()
                .book(testBook)
                .user(customer1)
                .rating(1)
                .comment("Spam link quảng cáo xấu")
                .status(Review.ReviewStatus.PENDING)
                .isApproved(false)
                .build());

        // Từ chối nhưng không nhập lý do -> Bị lỗi 400
        ModerateReviewRequest invalidReq = ModerateReviewRequest.builder()
                .status(Review.ReviewStatus.REJECTED)
                .rejectionReason("")
                .build();

        mockMvc.perform(put("/api/admin/reviews/" + review.getId() + "/moderate")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("nêu rõ lý do từ chối")));

        // Nhập đầy đủ lý do -> Thành công
        ModerateReviewRequest validReq = ModerateReviewRequest.builder()
                .status(Review.ReviewStatus.REJECTED)
                .rejectionReason("Nội dung vi phạm tiêu chuẩn cộng đồng, chứa spam")
                .build();

        mockMvc.perform(put("/api/admin/reviews/" + review.getId() + "/moderate")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Nội dung vi phạm tiêu chuẩn cộng đồng, chứa spam"));
    }

    @Test
    @DisplayName("Tự động đồng bộ điểm rating và reviewCount của Book khi kiểm duyệt hoặc xóa đánh giá")
    void testBookRatingAndReviewCountAutoSync() throws Exception {
        createDeliveredOrder(customer1, testBook, 1);
        createDeliveredOrder(customer2, testBook, 1);

        // Ban đầu book có rating 0.0, reviewCount 0
        Book initialBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(initialBook.getAverageRating()));
        assertEquals(0, initialBook.getReviewCount());

        // Review 1: 5 sao (APPROVED)
        Review r1 = reviewRepository.save(Review.builder()
                .book(testBook).user(customer1).rating(5).comment("5 sao tuyệt đỉnh")
                .status(Review.ReviewStatus.PENDING).isApproved(false).build());

        // Review 2: 3 sao (APPROVED)
        Review r2 = reviewRepository.save(Review.builder()
                .book(testBook).user(customer2).rating(3).comment("3 sao tạm ổn")
                .status(Review.ReviewStatus.PENDING).isApproved(false).build());

        // Duyệt review 1
        reviewService.moderateReview(r1.getId(), ModerateReviewRequest.builder().status(Review.ReviewStatus.APPROVED).build(), admin.getEmail());

        Book afterR1 = bookRepository.findById(testBook.getId()).orElseThrow();
        assertEquals(1, afterR1.getReviewCount());
        assertEquals(new BigDecimal("5.00"), afterR1.getAverageRating());

        // Duyệt review 2 -> Điểm trung bình = (5 + 3) / 2 = 4.00, count = 2
        reviewService.moderateReview(r2.getId(), ModerateReviewRequest.builder().status(Review.ReviewStatus.APPROVED).build(), admin.getEmail());

        Book afterR2 = bookRepository.findById(testBook.getId()).orElseThrow();
        assertEquals(2, afterR2.getReviewCount());
        assertEquals(new BigDecimal("4.00"), afterR2.getAverageRating());

        // Xóa review 2 -> Quay lại count = 1, rating = 5.00
        reviewService.deleteReview(r2.getId(), admin.getEmail(), true);

        Book afterDelete = bookRepository.findById(testBook.getId()).orElseThrow();
        assertEquals(1, afterDelete.getReviewCount());
        assertEquals(new BigDecimal("5.00"), afterDelete.getAverageRating());
    }

    @Test
    @DisplayName("Bảo mật & Phân quyền: ROLE_CUSTOMER bị từ chối 403 khi gọi API admin coupon/review")
    void testSecurity_CustomerForbiddenOnAdminEndpoints() throws Exception {
        // Customer cố gắng tạo coupon -> 403
        CreateCouponRequest couponReq = CreateCouponRequest.builder()
                .code("HACKCOUPON")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(1))
                .build();

        mockMvc.perform(post("/api/admin/coupons")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(couponReq)))
                .andExpect(status().isForbidden());

        // Customer cố gắng duyệt đánh giá -> 403
        mockMvc.perform(put("/api/admin/reviews/1/moderate")
                        .header("Authorization", "Bearer " + customer1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ModerateReviewRequest.builder().status(Review.ReviewStatus.APPROVED).build())))
                .andExpect(status().isForbidden());

        // Không có token -> 401
        mockMvc.perform(get("/api/admin/coupons"))
                .andExpect(status().isUnauthorized());

        // Staff & Admin -> 200 OK
        mockMvc.perform(get("/api/admin/coupons")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());
    }
}
