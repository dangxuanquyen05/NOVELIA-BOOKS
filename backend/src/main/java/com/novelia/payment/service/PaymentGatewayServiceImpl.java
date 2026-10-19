package com.novelia.payment.service;

import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.payment.config.VNPayProperties;
import com.novelia.payment.config.VNPaySecurityUtil;
import com.novelia.payment.dto.PaymentCallbackResult;
import com.novelia.payment.dto.PaymentInitRequest;
import com.novelia.payment.dto.PaymentUrlResponse;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.repository.PaymentRepository;
import com.novelia.user.entity.User;
import com.novelia.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import com.novelia.audit.service.AuditLogService;
import com.novelia.payment.dto.VNPayIpnResponse;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class PaymentGatewayServiceImpl implements PaymentGatewayService {

    private final VNPayProperties vnPayProperties;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public PaymentGatewayServiceImpl(
            VNPayProperties vnPayProperties,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            AuditLogService auditLogService) {
        this.vnPayProperties = vnPayProperties;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public PaymentUrlResponse createPaymentUrl(PaymentInitRequest request, String clientIp, String userEmail) {
        Order order = orderRepository.findByOrderNumber(request.getOrderNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + request.getOrderNumber()));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + userEmail));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền thanh toán cho đơn hàng này");
        }

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new BadRequestException("Đơn hàng #" + order.getOrderNumber() + " không ở trạng thái chờ thanh toán");
        }

        // Get or create payment record
        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElseGet(() -> {
            Payment newPayment = Payment.builder()
                    .order(order)
                    .paymentMethod(Payment.PaymentMethod.VNPAY)
                    .paymentStatus(Payment.PaymentStatus.UNPAID)
                    .amount(order.getTotalAmount())
                    .note("Thanh toán trực tuyến VNPay Sandbox")
                    .build();
            return paymentRepository.save(newPayment);
        });

        // Set payment method to VNPAY if not already
        payment.setPaymentMethod(Payment.PaymentMethod.VNPAY);
        paymentRepository.save(payment);

        // Build VNPay URL parameters according to official documentation
        long amountInVND = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amountInVND));
        vnpParams.put("vnp_CurrCode", "VND");

        if (request.getBankCode() != null && !request.getBankCode().trim().isEmpty()) {
            vnpParams.put("vnp_BankCode", request.getBankCode().trim());
        }

        vnpParams.put("vnp_TxnRef", order.getOrderNumber());
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getOrderNumber());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnPayProperties.getReturnUrl());
        vnpParams.put("vnp_IpAddr", (clientIp != null && !clientIp.isEmpty()) ? clientIp : "127.0.0.1");

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnpCreateDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_CreateDate", vnpCreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnpExpireDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        // Build query string and calculate hash
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                // Build hash data
                hashData.append(fieldName).append("=");
                try {
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    // Build query
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append("=");
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                } catch (UnsupportedEncodingException e) {
                    hashData.append(fieldValue);
                    query.append(fieldName).append("=").append(fieldValue);
                }
                if (itr.hasNext()) {
                    query.append("&");
                    hashData.append("&");
                }
            }
        }

        String queryUrl = query.toString();
        String vnpSecureHash = VNPaySecurityUtil.hmacSHA512(vnPayProperties.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnPayProperties.getPaymentUrl() + "?" + queryUrl;

        log.info("Generated VNPay payment URL for order #{}. Sandbox mode: {}", order.getOrderNumber(), vnPayProperties.isSandboxMode());

        return PaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .orderNumber(order.getOrderNumber())
                .amount(order.getTotalAmount())
                .paymentMethod("VNPAY")
                .sandboxMode(vnPayProperties.isSandboxMode())
                .liveCredentialsConfigured(vnPayProperties.isLiveCredentialsConfigured())
                .integrationNotice("Khung tích hợp thanh toán VNPay Sandbox. Tuân thủ tiêu chuẩn PCI-DSS, hệ thống tuyệt đối không lưu giữ thông tin thẻ của người dùng.")
                .build();
    }

    @Override
    @Transactional
    public PaymentCallbackResult processCallback(Map<String, String> queryParams) {
        String secureHash = queryParams.get("vnp_SecureHash");
        if (secureHash == null || secureHash.trim().isEmpty()) {
            throw new BadRequestException("Thiếu chữ ký bảo mật vnp_SecureHash từ cổng thanh toán");
        }

        // Filter valid vnp_* fields for hash verification
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : queryParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key != null && key.startsWith("vnp_") && !key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) {
                fields.put(key, value);
            }
        }

        String calculatedHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());
        if (!calculatedHash.equalsIgnoreCase(secureHash)) {
            log.warn("VNPay signature mismatch! Expected: {}, Received: {}", calculatedHash, secureHash);
            throw new BadRequestException("Chữ ký bảo mật không khớp. Nghi vấn dữ liệu phản hồi bị giả mạo.");
        }

        String orderNumber = queryParams.get("vnp_TxnRef");
        if (orderNumber == null) {
            throw new BadRequestException("Thiếu mã đơn hàng tham chiếu vnp_TxnRef");
        }

        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));

        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi thanh toán của đơn hàng #" + orderNumber));

        // IDEMPOTENCY CHECK: Prevent duplicate processing on retries or duplicated callbacks
        if (payment.getPaymentStatus() == Payment.PaymentStatus.PAID) {
            log.info("Idempotent check: Order #{} is already marked as PAID. Skipping duplicate processing.", orderNumber);
            return PaymentCallbackResult.builder()
                    .success(true)
                    .orderNumber(orderNumber)
                    .transactionCode(payment.getTransactionCode())
                    .amount(payment.getAmount())
                    .paymentStatus(payment.getPaymentStatus().name())
                    .responseCode(queryParams.get("vnp_ResponseCode"))
                    .message("Giao dịch đã được xác nhận thanh toán thành công trước đó (Idempotent callback)")
                    .isDuplicateRetry(true)
                    .build();
        }

        String responseCode = queryParams.get("vnp_ResponseCode");
        String transactionNo = queryParams.get("vnp_TransactionNo");

        if ("00".equals(responseCode)) {
            // Payment success
            payment.setPaymentStatus(Payment.PaymentStatus.PAID);
            payment.setTransactionCode(transactionNo);
            payment.setPaidAt(LocalDateTime.now());
            payment.setNote("Thanh toán thành công qua VNPay (Mã GD: " + transactionNo + ")");
            paymentRepository.save(payment);

            order.setStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);

            log.info("Order #{} marked as PAID and CONFIRMED via VNPay transaction {}", orderNumber, transactionNo);

            auditLogService.log(
                    "VNPAY_GATEWAY",
                    "PAYMENT_SUCCESS",
                    "Order",
                    String.valueOf(order.getId()),
                    "Thanh toán đơn hàng #" + orderNumber + " thành công qua VNPay (Mã GD: " + transactionNo + ")",
                    "Số tiền: " + payment.getAmount() + " VND, Mã phản hồi: " + responseCode,
                    queryParams.get("vnp_IpAddr") != null ? queryParams.get("vnp_IpAddr") : "VNPay-Gateway",
                    "SUCCESS"
            );

            return PaymentCallbackResult.builder()
                    .success(true)
                    .orderNumber(orderNumber)
                    .transactionCode(transactionNo)
                    .amount(payment.getAmount())
                    .paymentStatus("PAID")
                    .responseCode(responseCode)
                    .message("Thanh toán trực tuyến thành công")
                    .isDuplicateRetry(false)
                    .build();
        } else {
            // Payment failed or cancelled
            payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
            payment.setTransactionCode(transactionNo);
            payment.setNote("Thanh toán thất bại hoặc khách hủy: Mã phản hồi VNPay " + responseCode);
            paymentRepository.save(payment);

            log.info("Order #{} payment FAILED via VNPay with response code {}", orderNumber, responseCode);

            auditLogService.log(
                    "VNPAY_GATEWAY",
                    "PAYMENT_FAILED",
                    "Order",
                    String.valueOf(order.getId()),
                    "Thanh toán đơn hàng #" + orderNumber + " không thành công (Mã lỗi: " + responseCode + ")",
                    "Số tiền: " + payment.getAmount() + " VND",
                    queryParams.get("vnp_IpAddr") != null ? queryParams.get("vnp_IpAddr") : "VNPay-Gateway",
                    "FAILED"
            );

            return PaymentCallbackResult.builder()
                    .success(false)
                    .orderNumber(orderNumber)
                    .transactionCode(transactionNo)
                    .amount(payment.getAmount())
                    .paymentStatus("FAILED")
                    .responseCode(responseCode)
                    .message("Thanh toán không thành công (Mã phản hồi: " + responseCode + ")")
                    .isDuplicateRetry(false)
                    .build();
        }
    }

    @Override
    @Transactional
    public VNPayIpnResponse processIpn(Map<String, String> queryParams) {
        String secureHash = queryParams.get("vnp_SecureHash");
        if (secureHash == null || secureHash.trim().isEmpty()) {
            log.warn("VNPay IPN: Missing vnp_SecureHash");
            return VNPayIpnResponse.invalidChecksum();
        }

        // 1. Kiểm tra chữ ký bảo mật
        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : queryParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key != null && key.startsWith("vnp_") && !key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) {
                fields.put(key, value);
            }
        }

        String calculatedHash = VNPaySecurityUtil.hashAllFields(fields, vnPayProperties.getHashSecret());
        if (!calculatedHash.equalsIgnoreCase(secureHash)) {
            log.warn("VNPay IPN: Signature mismatch! Expected: {}, Received: {}", calculatedHash, secureHash);
            auditLogService.log(
                    "VNPAY_IPN",
                    "INVALID_SIGNATURE",
                    "Payment",
                    "N/A",
                    "Cảnh báo IPN chữ ký không hợp lệ từ máy chủ cổng thanh toán",
                    "Params: " + fields,
                    queryParams.get("vnp_IpAddr") != null ? queryParams.get("vnp_IpAddr") : "VNPay-IPN",
                    "SECURITY_ALERT"
            );
            return VNPayIpnResponse.invalidChecksum();
        }

        // 2. Tìm đơn hàng
        String orderNumber = queryParams.get("vnp_TxnRef");
        if (orderNumber == null || orderNumber.trim().isEmpty()) {
            return VNPayIpnResponse.orderNotFound();
        }

        var orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) {
            log.warn("VNPay IPN: Order #{} not found", orderNumber);
            return VNPayIpnResponse.orderNotFound();
        }
        Order order = orderOpt.get();

        var paymentList = paymentRepository.findByOrderId(order.getId());
        if (paymentList.isEmpty()) {
            log.warn("VNPay IPN: Payment record for order #{} not found", orderNumber);
            return VNPayIpnResponse.orderNotFound();
        }
        Payment payment = paymentList.get(0);

        // 3. Kiểm tra số tiền giao dịch (VNPay amount = order amount * 100)
        String vnpAmountStr = queryParams.get("vnp_Amount");
        if (vnpAmountStr != null) {
            try {
                long receivedAmount = Long.parseLong(vnpAmountStr);
                long expectedAmount = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
                if (receivedAmount != expectedAmount) {
                    log.warn("VNPay IPN: Amount mismatch for order #{}. Expected: {}, Received: {}", orderNumber, expectedAmount, receivedAmount);
                    return VNPayIpnResponse.invalidAmount();
                }
            } catch (NumberFormatException e) {
                return VNPayIpnResponse.invalidAmount();
            }
        }

        // 4. Kiểm tra giao dịch trùng lặp (Idempotency check)
        if (payment.getPaymentStatus() == Payment.PaymentStatus.PAID) {
            log.info("VNPay IPN Idempotent: Order #{} was already confirmed as PAID", orderNumber);
            return VNPayIpnResponse.alreadyConfirmed();
        }

        // 5. Cập nhật kết quả thanh toán
        String responseCode = queryParams.get("vnp_ResponseCode");
        String transactionNo = queryParams.get("vnp_TransactionNo");

        if ("00".equals(responseCode)) {
            payment.setPaymentStatus(Payment.PaymentStatus.PAID);
            payment.setTransactionCode(transactionNo);
            payment.setPaidAt(LocalDateTime.now());
            payment.setNote("Xác nhận tự động qua VNPay IPN (Mã GD: " + transactionNo + ")");
            paymentRepository.save(payment);

            order.setStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);

            auditLogService.log(
                    "VNPAY_IPN",
                    "PAYMENT_CONFIRMED",
                    "Order",
                    String.valueOf(order.getId()),
                    "Xác nhận thanh toán thành công qua IPN cho đơn #" + orderNumber,
                    "Mã GD VNPay: " + transactionNo + ", Số tiền: " + payment.getAmount(),
                    queryParams.get("vnp_IpAddr") != null ? queryParams.get("vnp_IpAddr") : "VNPay-IPN",
                    "SUCCESS"
            );

            log.info("VNPay IPN: Order #{} confirmed PAID successfully", orderNumber);
            return VNPayIpnResponse.success();
        } else {
            payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
            payment.setTransactionCode(transactionNo);
            payment.setNote("VNPay IPN báo thất bại: Mã " + responseCode);
            paymentRepository.save(payment);

            auditLogService.log(
                    "VNPAY_IPN",
                    "PAYMENT_FAILED",
                    "Order",
                    String.valueOf(order.getId()),
                    "Giao dịch IPN thất bại cho đơn #" + orderNumber + " (Mã lỗi: " + responseCode + ")",
                    "Số tiền: " + payment.getAmount(),
                    queryParams.get("vnp_IpAddr") != null ? queryParams.get("vnp_IpAddr") : "VNPay-IPN",
                    "FAILED"
            );

            log.info("VNPay IPN: Order #{} marked as FAILED with code {}", orderNumber, responseCode);
            return VNPayIpnResponse.success(); // VNPay specification requires 00 to acknowledge receipt even on failed user payments
        }
    }

    @Override
    @Transactional
    public PaymentCallbackResult simulateTestPaymentSuccess(String orderNumber, String userEmail) {
        if (!vnPayProperties.isSandboxMode()) {
            throw new BadRequestException("Chức năng mô phỏng thanh toán chỉ được phép hoạt động trong môi trường Sandbox");
        }

        // Safe simulation helper for testing sandbox environment without hitting real bank
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + userEmail));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn hàng này");
        }

        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElseGet(() -> {
            Payment newPayment = Payment.builder()
                    .order(order)
                    .paymentMethod(Payment.PaymentMethod.VNPAY)
                    .paymentStatus(Payment.PaymentStatus.UNPAID)
                    .amount(order.getTotalAmount())
                    .build();
            return paymentRepository.save(newPayment);
        });

        if (payment.getPaymentStatus() == Payment.PaymentStatus.PAID) {
            return PaymentCallbackResult.builder()
                    .success(true)
                    .orderNumber(orderNumber)
                    .transactionCode(payment.getTransactionCode())
                    .amount(payment.getAmount())
                    .paymentStatus("PAID")
                    .responseCode("00")
                    .message("Đơn hàng đã được thanh toán trước đó")
                    .isDuplicateRetry(true)
                    .build();
        }

        String mockTxn = "SANDBOX-SIM-" + System.currentTimeMillis();
        payment.setPaymentMethod(Payment.PaymentMethod.VNPAY);
        payment.setPaymentStatus(Payment.PaymentStatus.PAID);
        payment.setTransactionCode(mockTxn);
        payment.setPaidAt(LocalDateTime.now());
        payment.setNote("Xác nhận thanh toán thành công trong môi trường Sandbox/Thử nghiệm");
        paymentRepository.save(payment);

        order.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);

        log.info("Simulated sandbox payment success for order #{} by {}", orderNumber, userEmail);

        return PaymentCallbackResult.builder()
                .success(true)
                .orderNumber(orderNumber)
                .transactionCode(mockTxn)
                .amount(payment.getAmount())
                .paymentStatus("PAID")
                .responseCode("00")
                .message("Xác nhận thanh toán thử nghiệm thành công")
                .isDuplicateRetry(false)
                .build();
    }
}
