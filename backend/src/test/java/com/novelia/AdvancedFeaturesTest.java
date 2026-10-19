package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.coupon.entity.Coupon;
import com.novelia.coupon.repository.CouponRepository;
import com.novelia.coupon.service.CouponService;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.OrderItem;
import com.novelia.order.repository.OrderRepository;
import com.novelia.payment.config.VNPayProperties;
import com.novelia.payment.config.VNPaySecurityUtil;
import com.novelia.payment.dto.PaymentInitRequest;
import com.novelia.payment.dto.PaymentUrlResponse;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.repository.PaymentRepository;
import com.novelia.payment.service.PaymentGatewayService;
import com.novelia.review.dto.CreateReviewRequest;
import com.novelia.review.dto.ModerateReviewRequest;
import com.novelia.review.entity.Review;
import com.novelia.review.repository.ReviewRepository;
import com.novelia.shipment.dto.CreateShipmentRequest;
import com.novelia.shipment.dto.ShipmentResponse;
import com.novelia.shipment.service.ShippingCarrierService;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
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
@ActiveProfiles("test")
@Transactional
public class AdvancedFeaturesTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CouponService couponService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentGatewayService paymentGatewayService;

    @Autowired
    private VNPayProperties vnPayProperties;

    @Autowired
    private ShippingCarrierService shippingCarrierService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testCustomer;
    private User testAdmin;
    private Book testBook;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").description("Khách hàng").build()));
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Quản trị viên").build()));

        testCustomer = userRepository.findByEmail("adv_cust@novelia.vn")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("adv_cust@novelia.vn")
                        .passwordHash(passwordEncoder.encode("Password123!"))
                        .fullName("Độc Giả Thử Nghiệm Nâng Cao")
                        .phone("0988776655")
                        .roles(Set.of(customerRole))
                        .build()));

        testAdmin = userRepository.findByEmail("adv_admin@novelia.vn")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("adv_admin@novelia.vn")
                        .passwordHash(passwordEncoder.encode("Password123!"))
                        .fullName("Quản Trị Thử Nghiệm Nâng Cao")
                        .phone("0988776656")
                        .roles(Set.of(adminRole))
                        .build()));

        testBook = bookRepository.findAll().stream().findFirst()
                .orElseGet(() -> bookRepository.save(Book.builder()
                        .title("Tác Phẩm Thử Nghiệm Nâng Cao")
                        .slug("tac-pham-thu-nghiem-nang-cao")
                        .isbn("978-604-0-99999-1")
                        .salePrice(new BigDecimal("200000.00"))
                        .originalPrice(new BigDecimal("250000.00"))
                        .status(Book.BookStatus.PUBLISHED)
                        .build()));

        testOrder = orderRepository.save(Order.builder()
                .orderNumber("NOV-ADV-TEST-" + System.currentTimeMillis())
                .user(testCustomer)
                .subtotal(new BigDecimal("300000.00"))
                .shippingFee(new BigDecimal("30000.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("330000.00"))
                .status(Order.OrderStatus.PENDING)
                .receiverName("Người Nhận Thử Nghiệm")
                .receiverPhone("0988776655")
                .shippingAddress("123 Phố Sách, Hà Nội")
                .build());

        paymentRepository.save(Payment.builder()
                .order(testOrder)
                .paymentMethod(Payment.PaymentMethod.VNPAY)
                .paymentStatus(Payment.PaymentStatus.UNPAID)
                .amount(testOrder.getTotalAmount())
                .build());
    }

    // ==========================================
    // 1. KIỂM THỬ MÃ GIẢM GIÁ (COUPON)
    // ==========================================

    @Test
    @DisplayName("Coupon: Tính giảm giá phần trăm chính xác kèm trần tối đa (maxDiscountAmount)")
    void testCouponPercentageWithMaxCap() {
        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("TESTPERCENT10")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00")) // 10%
                .minOrderValue(new BigDecimal("200000.00"))
                .maxDiscountAmount(new BigDecimal("25000.00")) // Giới hạn tối đa 25.000đ
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .usageLimit(100)
                .usedCount(0)
                .build());

        // Đơn hàng 500.000đ: 10% = 50.000đ, nhưng chạm trần maxDiscountAmount -> giảm đúng 25.000đ
        var valResult = couponService.validateCoupon("TESTPERCENT10", new BigDecimal("500000.00"));
        assertTrue(valResult.isValid());
        assertEquals(0, new BigDecimal("25000.00").compareTo(valResult.getDiscountAmount()));
        assertEquals(0, new BigDecimal("475000.00").compareTo(valResult.getFinalAmount()));
    }

    @Test
    @DisplayName("Coupon: Từ chối áp dụng khi đơn hàng chưa đạt giá trị tối thiểu (minOrderValue)")
    void testCouponRejectsBelowMinOrderValue() {
        couponRepository.save(Coupon.builder()
                .code("MIN500K")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000.00"))
                .minOrderValue(new BigDecimal("500000.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .build());

        var valResult = couponService.validateCoupon("MIN500K", new BigDecimal("450000.00"));
        assertFalse(valResult.isValid());
        assertTrue(valResult.getMessage().contains("chưa đạt giá trị tối thiểu"));
    }

    @Test
    @DisplayName("Coupon: Từ chối áp dụng khi mã đã hết hạn hoặc hết lượt sử dụng")
    void testCouponExpiredOrExceededUsage() {
        Coupon expired = couponRepository.save(Coupon.builder()
                .code("EXPIREDCODE")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("20000.00"))
                .startDate(LocalDateTime.now().minusDays(10))
                .endDate(LocalDateTime.now().minusDays(1)) // Đã hết hạn hôm qua
                .isActive(true)
                .build());

        var expResult = couponService.validateCoupon("EXPIREDCODE", new BigDecimal("300000.00"));
        assertFalse(expResult.isValid());
        assertTrue(expResult.getMessage().contains("hết hạn sử dụng"));

        Coupon maxedOut = couponRepository.save(Coupon.builder()
                .code("MAXEDOUT")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("20000.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(5)
                .usedCount(5) // Đã dùng hết 5/5
                .isActive(true)
                .build());

        var maxResult = couponService.validateCoupon("MAXEDOUT", new BigDecimal("300000.00"));
        assertFalse(maxResult.isValid());
        assertTrue(maxResult.getMessage().contains("đạt số lượt sử dụng tối đa"));
    }

    // ==========================================
    // 2. KIỂM THỬ ĐÁNH GIÁ SÁCH & KIỂM DUYỆT (REVIEW)
    // ==========================================

    @Test
    @WithMockUser(username = "adv_cust@novelia.vn", roles = {"CUSTOMER"})
    @DisplayName("Review: Độc giả gửi đánh giá thành công, mặc định ở trạng thái PENDING chờ kiểm duyệt")
    void testCustomerCreateReviewPendingModeration() throws Exception {
        Order deliveredOrder = Order.builder()
                .orderNumber("NOV-DELIV-" + System.currentTimeMillis())
                .user(testCustomer)
                .subtotal(testBook.getSalePrice())
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(testBook.getSalePrice())
                .status(Order.OrderStatus.DELIVERED)
                .receiverName(testCustomer.getFullName())
                .receiverPhone(testCustomer.getPhone())
                .shippingAddress("123 Phố Sách")
                .items(new ArrayList<>())
                .build();
        OrderItem item = OrderItem.builder()
                .order(deliveredOrder)
                .book(testBook)
                .bookTitle(testBook.getTitle())
                .quantity(1)
                .price(testBook.getSalePrice())
                .totalPrice(testBook.getSalePrice())
                .build();
        deliveredOrder.getItems().add(item);
        orderRepository.save(deliveredOrder);

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Bản dịch tuyệt hảo, chất giấy và thiết kế rất trang nhã, đúng phong cách Novelia!")
                .build();

        mockMvc.perform(post("/api/books/" + testBook.getId() + "/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.isApproved").value(false));

        // Public API xem review của sách chưa hiển thị review PENDING này
        mockMvc.perform(get("/api/books/" + testBook.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", not(hasItem(hasEntry("comment", request.getComment())))));
    }

    @Test
    @WithMockUser(username = "adv_admin@novelia.vn", roles = {"ADMIN"})
    @DisplayName("Review: Quản trị viên kiểm duyệt APPROVED và đánh giá được hiển thị công khai")
    void testAdminModerateReviewApprove() throws Exception {
        Review review = reviewRepository.save(Review.builder()
                .book(testBook)
                .user(testCustomer)
                .rating(5)
                .comment("Đánh giá mẫu cần kiểm duyệt duyệt công khai")
                .status(Review.ReviewStatus.PENDING)
                .isApproved(false)
                .build());

        ModerateReviewRequest modRequest = ModerateReviewRequest.builder()
                .status(Review.ReviewStatus.APPROVED)
                .build();

        mockMvc.perform(put("/api/admin/reviews/" + review.getId() + "/moderate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.isApproved").value(true));

        // Sau khi duyệt, public API hiển thị review thành công
        mockMvc.perform(get("/api/books/" + testBook.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasItem(hasEntry("comment", review.getComment()))));
    }

    @Test
    @WithMockUser(username = "adv_cust@novelia.vn", roles = {"CUSTOMER"})
    @DisplayName("Review: Khách hàng thường bị chặn (403 Forbidden) khi cố truy cập API kiểm duyệt")
    void testCustomerCannotAccessReviewModeration() throws Exception {
        ModerateReviewRequest modRequest = ModerateReviewRequest.builder()
                .status(Review.ReviewStatus.APPROVED)
                .build();

        mockMvc.perform(put("/api/admin/reviews/1/moderate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modRequest)))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 3. KIỂM THỬ THANH TOÁN (PAYMENT GATEWAY & VNPAY)
    // ==========================================

    @Test
    @WithMockUser(username = "adv_cust@novelia.vn", roles = {"CUSTOMER"})
    @DisplayName("Payment: Khởi tạo URL VNPay Sandbox với chữ ký bảo mật HMAC-SHA512")
    void testCreateVNPayPaymentUrl() {
        PaymentInitRequest request = PaymentInitRequest.builder()
                .orderNumber(testOrder.getOrderNumber())
                .paymentMethod("VNPAY")
                .build();

        PaymentUrlResponse response = paymentGatewayService.createPaymentUrl(request, "127.0.0.1", "adv_cust@novelia.vn");

        assertNotNull(response.getPaymentUrl());
        assertTrue(response.getPaymentUrl().contains("vnp_SecureHash"));
        assertTrue(response.getPaymentUrl().contains(testOrder.getOrderNumber()));
        assertTrue(response.isSandboxMode());
        assertNotNull(response.getIntegrationNotice());
    }

    @Test
    @DisplayName("Payment: Xử lý Callback hợp lệ chuyển trạng thái đơn hàng sang CONFIRMED và thanh toán sang PAID")
    void testProcessValidVNPayCallback() {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000"); // 330.000đ x 100
        fields.put("vnp_BankCode", "NCB");
        fields.put("vnp_CardType", "ATM");
        fields.put("vnp_OrderInfo", "Thanh toan don hang #" + testOrder.getOrderNumber());
        fields.put("vnp_PayDate", "20261016230000");
        fields.put("vnp_ResponseCode", "00"); // Thành công
        fields.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        fields.put("vnp_TransactionNo", "14890234");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());

        String validHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());
        fields.put("vnp_SecureHash", validHash);

        var callbackResult = paymentGatewayService.processCallback(fields);

        assertTrue(callbackResult.isSuccess());
        assertEquals("PAID", callbackResult.getPaymentStatus());
        assertFalse(callbackResult.isDuplicateRetry());

        Order updatedOrder = orderRepository.findByOrderNumber(testOrder.getOrderNumber()).orElseThrow();
        assertEquals(Order.OrderStatus.CONFIRMED, updatedOrder.getStatus());
    }

    @Test
    @DisplayName("Payment: Chống giao dịch trùng / Retry Callback (Idempotency)")
    void testIdempotentCallbackProcessing() {
        // Đã thanh toán trước đó
        Payment payment = paymentRepository.findByOrderId(testOrder.getId()).get(0);
        payment.setPaymentStatus(Payment.PaymentStatus.PAID);
        payment.setTransactionCode("14890234");
        paymentRepository.save(payment);
        testOrder.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(testOrder);

        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        fields.put("vnp_TransactionNo", "14890234");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());

        String validHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());
        fields.put("vnp_SecureHash", validHash);

        var retryResult = paymentGatewayService.processCallback(fields);

        assertTrue(retryResult.isSuccess());
        assertTrue(retryResult.isDuplicateRetry(), "Hệ thống phải nhận diện đây là callback lặp lại (Idempotency)");
    }

    @Test
    @DisplayName("Payment: Từ chối callback có chữ ký giả mạo (Invalid Signature)")
    void testRejectForgedVNPayCallback() {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());
        fields.put("vnp_SecureHash", "FAKESIGNATURE1234567890ABCDEF");

        assertThrows(RuntimeException.class, () -> paymentGatewayService.processCallback(fields));
    }

    // ==========================================
    // 4. KIỂM THỬ ĐƠN VỊ VẬN CHUYỂN (SHIPPING INTEGRATION)
    // ==========================================

    @Test
    @DisplayName("Shipping: Tuyệt đối KHÔNG tạo mã vận đơn giả khi chưa cấu hình live credentials")
    void testShippingFrameworkDoesNotGenerateFakeTrackingNumber() {
        CreateShipmentRequest req = CreateShipmentRequest.builder()
                .orderId(testOrder.getId())
                .carrierName("GiaoHangNhanh")
                .note("Yêu cầu giao giờ hành chính")
                .build();

        ShipmentResponse shipment = shippingCarrierService.createShipment(req);

        assertNotNull(shipment);
        assertNull(shipment.getTrackingNumber(), "Khi chưa có API credentials chính thức, trackingNumber PHẢI là null - không được tự tạo mã giả");
        assertFalse(shipment.isLiveCarrierConnected(), "liveCarrierConnected phải là false");
        assertTrue(shipment.getIntegrationNotice().contains("Khung tích hợp"));
    }
}
