package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.common.exception.BadRequestException;
import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.payment.config.VNPayProperties;
import com.novelia.payment.config.VNPaySecurityUtil;
import com.novelia.payment.dto.*;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.repository.PaymentRepository;
import com.novelia.payment.service.PaymentGatewayService;
import com.novelia.shipment.config.ShippingProperties;
import com.novelia.shipment.dto.*;
import com.novelia.shipment.entity.Shipment;
import com.novelia.shipment.repository.ShipmentRepository;
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
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PaymentAndShippingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentGatewayService paymentGatewayService;

    @Autowired
    private ShippingCarrierService shippingCarrierService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private VNPayProperties vnPayProperties;

    @Autowired
    private ShippingProperties shippingProperties;

    private User testCustomer;
    private Order testOrder;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("ROLE_CUSTOMER")
                        .description("Khách hàng")
                        .build()));

        testCustomer = userRepository.findByEmail("phase9_cust@novelia.vn")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("phase9_cust@novelia.vn")
                        .passwordHash(passwordEncoder.encode("Password123!"))
                        .fullName("Độc Giả Thử Nghiệm Giai Đoạn 9")
                        .phone("0988776655")
                        .roles(Set.of(customerRole))
                        .build()));

        testOrder = orderRepository.save(Order.builder()
                .orderNumber("NOV-PHASE9-" + System.currentTimeMillis())
                .user(testCustomer)
                .subtotal(new BigDecimal("300000.00"))
                .shippingFee(new BigDecimal("30000.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("330000.00"))
                .status(Order.OrderStatus.PENDING)
                .receiverName("Người Nhận Phase 9")
                .receiverPhone("0988776655")
                .shippingAddress("123 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội")
                .build());

        testPayment = paymentRepository.save(Payment.builder()
                .order(testOrder)
                .paymentMethod(Payment.PaymentMethod.VNPAY)
                .paymentStatus(Payment.PaymentStatus.UNPAID)
                .amount(testOrder.getTotalAmount())
                .note("Thử nghiệm VNPay Sandbox")
                .build());
    }

    // ==========================================
    // 1. KIỂM THỬ THANH TOÁN (PAYMENT GATEWAY - VNPAY)
    // ==========================================

    @Test
    @WithMockUser(username = "phase9_cust@novelia.vn", roles = {"CUSTOMER"})
    @DisplayName("Payment: Khởi tạo URL VNPay Sandbox tuân thủ PCI-DSS, không lưu thông tin thẻ nhạy cảm")
    void testCreatePaymentUrlSecurityAndPciDss() {
        PaymentInitRequest request = PaymentInitRequest.builder()
                .orderNumber(testOrder.getOrderNumber())
                .paymentMethod("VNPAY")
                .build();

        PaymentUrlResponse response = paymentGatewayService.createPaymentUrl(request, "127.0.0.1", "phase9_cust@novelia.vn");

        assertNotNull(response.getPaymentUrl());
        assertTrue(response.getPaymentUrl().contains("vnp_SecureHash"), "URL phải chứa chữ ký băm bảo mật vnp_SecureHash");
        assertTrue(response.getPaymentUrl().contains(testOrder.getOrderNumber()));
        assertTrue(response.isSandboxMode());
        assertTrue(response.getIntegrationNotice().contains("PCI-DSS"), "Phải có thông báo tuân thủ PCI-DSS không lưu trữ thẻ");
    }

    @Test
    @DisplayName("Payment: Xử lý Callback hợp lệ cập nhật PaymentStatus = PAID và OrderStatus = CONFIRMED")
    void testProcessValidPaymentCallback() {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000"); // 330.000đ x 100
        fields.put("vnp_BankCode", "NCB");
        fields.put("vnp_CardType", "ATM");
        fields.put("vnp_OrderInfo", "Thanh toan don hang #" + testOrder.getOrderNumber());
        fields.put("vnp_PayDate", "20261017120000");
        fields.put("vnp_ResponseCode", "00"); // Thành công
        fields.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        fields.put("vnp_TransactionNo", "14899999");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());

        String validHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());
        fields.put("vnp_SecureHash", validHash);

        PaymentCallbackResult result = paymentGatewayService.processCallback(fields);

        assertTrue(result.isSuccess());
        assertEquals("PAID", result.getPaymentStatus());
        assertFalse(result.isDuplicateRetry());

        Order updatedOrder = orderRepository.findByOrderNumber(testOrder.getOrderNumber()).orElseThrow();
        assertEquals(Order.OrderStatus.CONFIRMED, updatedOrder.getStatus(), "Đơn hàng phải chuyển sang CONFIRMED khi thanh toán thành công");
    }

    @Test
    @DisplayName("Payment: Từ chối xử lý Callback khi chữ ký bị giả mạo (Invalid Hash)")
    void testRejectTamperedPaymentCallback() {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());
        fields.put("vnp_SecureHash", "FAKE_TAMPERED_SIGNATURE_99999");

        assertThrows(BadRequestException.class, () -> paymentGatewayService.processCallback(fields));

        // Kiểm tra trạng thái đơn và thanh toán không bị thay đổi
        Payment p = paymentRepository.findByOrderId(testOrder.getId()).get(0);
        assertEquals(Payment.PaymentStatus.UNPAID, p.getPaymentStatus());
        Order o = orderRepository.findByOrderNumber(testOrder.getOrderNumber()).orElseThrow();
        assertEquals(Order.OrderStatus.PENDING, o.getStatus());
    }

    @Test
    @DisplayName("Payment: Chống xử lý lặp lại callback nhiều lần (Idempotency check)")
    void testPaymentIdempotentCallbackDuplicate() {
        // Đã thanh toán trước đó
        testPayment.setPaymentStatus(Payment.PaymentStatus.PAID);
        testPayment.setTransactionCode("14899999");
        paymentRepository.save(testPayment);

        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        fields.put("vnp_TransactionNo", "14899999");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());

        String validHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());
        fields.put("vnp_SecureHash", validHash);

        PaymentCallbackResult result = paymentGatewayService.processCallback(fields);

        assertTrue(result.isSuccess());
        assertTrue(result.isDuplicateRetry(), "Hệ thống phải nhận diện đây là yêu cầu callback lặp lại (Idempotency)");
    }

    @Test
    @DisplayName("Payment: Phân biệt trạng thái thanh toán FAILED nhưng không tự ý hủy đơn hàng")
    void testPaymentFailurePreservesOrderPending() {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000");
        fields.put("vnp_ResponseCode", "24"); // Khách hàng hủy giao dịch
        fields.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        fields.put("vnp_TransactionNo", "14899998");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());

        String validHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());
        fields.put("vnp_SecureHash", validHash);

        PaymentCallbackResult result = paymentGatewayService.processCallback(fields);

        assertFalse(result.isSuccess());
        assertEquals("FAILED", result.getPaymentStatus());

        Order o = orderRepository.findByOrderNumber(testOrder.getOrderNumber()).orElseThrow();
        assertEquals(Order.OrderStatus.PENDING, o.getStatus(), "Đơn hàng vẫn giữ PENDING để khách có thể thử thanh toán lại hoặc đổi COD");
    }

    @Test
    @DisplayName("Payment IPN: Xử lý IPN thành công trả về RspCode 00 chuẩn tài liệu VNPay")
    void testProcessValidVNPayIpn() throws Exception {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        fields.put("vnp_TransactionNo", "IPN-14890001");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());

        String validHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());

        mockMvc.perform(get("/api/payment/vnpay-ipn")
                        .param("vnp_Amount", "33000000")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_TmnCode", vnPayProperties.getTmnCode())
                        .param("vnp_TransactionNo", "IPN-14890001")
                        .param("vnp_TxnRef", testOrder.getOrderNumber())
                        .param("vnp_SecureHash", validHash))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"))
                .andExpect(jsonPath("$.Message").value("Confirm Success"));

        Order o = orderRepository.findByOrderNumber(testOrder.getOrderNumber()).orElseThrow();
        assertEquals(Order.OrderStatus.CONFIRMED, o.getStatus());
    }

    @Test
    @DisplayName("Payment IPN: Sai chữ ký bảo mật trả về RspCode 97 (Invalid Checksum)")
    void testVNPayIpnInvalidChecksum() throws Exception {
        mockMvc.perform(get("/api/payment/vnpay-ipn")
                        .param("vnp_Amount", "33000000")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_TxnRef", testOrder.getOrderNumber())
                        .param("vnp_SecureHash", "INVALID_CHECKSUM_TEST"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("97"))
                .andExpect(jsonPath("$.Message").value("Invalid Checksum"));
    }

    @Test
    @DisplayName("Payment IPN: Đơn hàng đã thanh toán trước đó trả về RspCode 02 (Order already confirmed)")
    void testVNPayIpnAlreadyConfirmed() throws Exception {
        testPayment.setPaymentStatus(Payment.PaymentStatus.PAID);
        paymentRepository.save(testPayment);

        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Amount", "33000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        fields.put("vnp_TransactionNo", "IPN-14890002");
        fields.put("vnp_TxnRef", testOrder.getOrderNumber());

        String validHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());

        mockMvc.perform(get("/api/payment/vnpay-ipn")
                        .param("vnp_Amount", "33000000")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_TmnCode", vnPayProperties.getTmnCode())
                        .param("vnp_TransactionNo", "IPN-14890002")
                        .param("vnp_TxnRef", testOrder.getOrderNumber())
                        .param("vnp_SecureHash", validHash))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("02"))
                .andExpect(jsonPath("$.Message").value("Order already confirmed"));
    }

    // ==========================================
    // 2. KIỂM THỬ VẬN CHUYỂN (SHIPPING CARRIER - GHN)
    // ==========================================

    @Test
    @DisplayName("Shipping: Tính cước vận chuyển miễn phí (Freeship) cho đơn hàng từ 500.000 VNĐ")
    void testCalculateShippingFeeFreeshipAbove500k() {
        ShippingFeeCalculateRequest request = ShippingFeeCalculateRequest.builder()
                .toProvince("Hà Nội")
                .toDistrict("Hoàn Kiếm")
                .weightGrams(800)
                .orderAmount(new BigDecimal("550000.00")) // >= 500k
                .build();

        ShippingFeeCalculateResponse response = shippingCarrierService.calculateShippingFee(request);

        assertNotNull(response);
        assertTrue(response.isFreeShipping());
        assertEquals(0, BigDecimal.ZERO.compareTo(response.getShippingFee()));
        assertTrue(response.getOriginalFee().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(response.getNotice().contains("Miễn phí vận chuyển"));
    }

    @Test
    @DisplayName("Shipping: Tính cước vận chuyển chuẩn nội thành và liên tỉnh khi chưa đạt Freeship")
    void testCalculateShippingFeeStandardRules() {
        // Nội thành Hà Nội (< 500k, 500g): 25.000đ
        ShippingFeeCalculateRequest hanoiReq = ShippingFeeCalculateRequest.builder()
                .toProvince("Hà Nội")
                .toDistrict("Đống Đa")
                .weightGrams(500)
                .orderAmount(new BigDecimal("200000.00"))
                .build();

        ShippingFeeCalculateResponse hanoiRes = shippingCarrierService.calculateShippingFee(hanoiReq);
        assertEquals(0, new BigDecimal("25000").compareTo(hanoiRes.getShippingFee()));
        assertEquals(2, hanoiRes.getEstimatedDays());

        // Liên tỉnh Đà Nẵng (< 500k, 500g): 35.000đ
        ShippingFeeCalculateRequest daNangReq = ShippingFeeCalculateRequest.builder()
                .toProvince("Đà Nẵng")
                .toDistrict("Hải Châu")
                .weightGrams(500)
                .orderAmount(new BigDecimal("200000.00"))
                .build();

        ShippingFeeCalculateResponse daNangRes = shippingCarrierService.calculateShippingFee(daNangReq);
        assertEquals(0, new BigDecimal("35000").compareTo(daNangRes.getShippingFee()));
        assertEquals(4, daNangRes.getEstimatedDays());
    }

    @Test
    @DisplayName("Shipping: Tuyệt đối KHÔNG tạo mã vận đơn giả khi thiếu live credentials")
    void testCreateShipmentWithoutFakeTrackingNumber() {
        CreateShipmentRequest req = CreateShipmentRequest.builder()
                .orderId(testOrder.getId())
                .carrierName("GiaoHangNhanh")
                .note("Giao giờ hành chính")
                .build();

        ShipmentResponse res = shippingCarrierService.createShipment(req);

        assertNotNull(res);
        assertNull(res.getTrackingNumber(), "Khi chưa có live API credentials, trackingNumber PHẢI là null để đảm bảo tính trung thực");
        assertFalse(res.isLiveCarrierConnected());
        assertTrue(res.getIntegrationNotice().contains("Khung tích hợp") || res.getIntegrationNotice().contains("Khung chuẩn bị"));
        assertEquals("PENDING", res.getShippingStatus());
    }

    @Test
    @DisplayName("Shipping: Chống tạo vận đơn gửi trùng (Idempotency)")
    void testCreateShipmentIdempotencyDuplicate() {
        CreateShipmentRequest req = CreateShipmentRequest.builder()
                .orderId(testOrder.getId())
                .carrierName("GiaoHangNhanh")
                .build();

        ShipmentResponse first = shippingCarrierService.createShipment(req);
        ShipmentResponse second = shippingCarrierService.createShipment(req);

        assertEquals(first.getId(), second.getId(), "Hai lần gọi tạo vận đơn cho cùng 1 đơn hàng phải trả về cùng 1 shipment");
    }

    @Test
    @DisplayName("Shipping Webhook: Đồng bộ trạng thái DELIVERED từ GHN và tự động cập nhật Order sang DELIVERED")
    void testGhnWebhookSyncDelivered() {
        Shipment shipment = shipmentRepository.save(Shipment.builder()
                .order(testOrder)
                .trackingNumber("GHN-LIVE-TEST-12345")
                .shippingCarrier("GiaoHangNhanh")
                .shippingStatus(Shipment.ShippingStatus.IN_TRANSIT)
                .build());

        testOrder.setStatus(Order.OrderStatus.SHIPPING);
        orderRepository.save(testOrder);

        GhnWebhookPayload payload = GhnWebhookPayload.builder()
                .orderCode("GHN-LIVE-TEST-12345")
                .clientOrderCode(testOrder.getOrderNumber())
                .status("delivered")
                .description("Bưu tá đã giao hàng thành công và nhận tiền")
                .build();

        ShipmentResponse response = shippingCarrierService.processGhnWebhook(payload, shippingProperties.getWebhookToken());

        assertEquals("DELIVERED", response.getShippingStatus());
        assertNotNull(response.getActualDelivery());

        Order updatedOrder = orderRepository.findByOrderNumber(testOrder.getOrderNumber()).orElseThrow();
        assertEquals(Order.OrderStatus.DELIVERED, updatedOrder.getStatus(), "Trạng thái đơn hàng phải đồng bộ sang DELIVERED");
    }

    @Test
    @DisplayName("Shipping Webhook: Chống xử lý lặp lại webhook giao hàng (Idempotency)")
    void testGhnWebhookIdempotentDuplicate() {
        Shipment shipment = shipmentRepository.save(Shipment.builder()
                .order(testOrder)
                .trackingNumber("GHN-LIVE-TEST-99999")
                .shippingCarrier("GiaoHangNhanh")
                .shippingStatus(Shipment.ShippingStatus.DELIVERED)
                .actualDelivery(LocalDateTime.now())
                .build());

        GhnWebhookPayload payload = GhnWebhookPayload.builder()
                .orderCode("GHN-LIVE-TEST-99999")
                .status("delivered")
                .description("Giao hàng thành công (Gửi lại lần 2)")
                .build();

        ShipmentResponse response = shippingCarrierService.processGhnWebhook(payload, shippingProperties.getWebhookToken());

        assertEquals("DELIVERED", response.getShippingStatus());
    }

    @Test
    @DisplayName("Shipping Webhook: Từ chối webhook khi token xác thực bị sai")
    void testGhnWebhookRejectInvalidToken() {
        GhnWebhookPayload payload = GhnWebhookPayload.builder()
                .orderCode("GHN-TEST")
                .status("delivered")
                .build();

        assertThrows(BadRequestException.class, () ->
                shippingCarrierService.processGhnWebhook(payload, "WRONG_TOKEN"));
    }
}
