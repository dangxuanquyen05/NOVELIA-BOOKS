package com.novelia.order.service;

import com.novelia.book.entity.Book;
import com.novelia.cart.dto.CartItemResponse;
import com.novelia.cart.entity.Cart;
import com.novelia.cart.entity.CartItem;
import com.novelia.cart.repository.CartItemRepository;
import com.novelia.cart.repository.CartRepository;
import com.novelia.common.dto.PageResponse;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.entity.InventoryTransaction;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.inventory.repository.InventoryTransactionRepository;
import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import com.novelia.order.dto.*;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.Order.OrderStatus;
import com.novelia.order.entity.OrderItem;
import com.novelia.order.repository.OrderItemRepository;
import com.novelia.order.repository.OrderRepository;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.entity.Payment.PaymentStatus;
import com.novelia.payment.repository.PaymentRepository;
import com.novelia.user.dto.AddressResponse;
import com.novelia.user.entity.Address;
import com.novelia.user.entity.User;
import com.novelia.user.repository.AddressRepository;
import com.novelia.coupon.service.CouponService;
import com.novelia.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final PaymentRepository paymentRepository;
    private final CouponService couponService;
    private final com.novelia.order.repository.OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final com.novelia.audit.service.AuditLogService auditLogService;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository,
            AddressRepository addressRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            PaymentRepository paymentRepository,
            CouponService couponService,
            com.novelia.order.repository.OrderStatusHistoryRepository orderStatusHistoryRepository,
            com.novelia.audit.service.AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.paymentRepository = paymentRepository;
        this.couponService = couponService;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.auditLogService = auditLogService;
    }

    private void recordStatusHistory(Order order, String fromStatus, String toStatus, String action, String changedBy, String note) {
        try {
            com.novelia.order.entity.OrderStatusHistory history = com.novelia.order.entity.OrderStatusHistory.builder()
                    .order(order)
                    .fromStatus(fromStatus)
                    .toStatus(toStatus)
                    .action(action)
                    .changedBy(changedBy != null ? changedBy : "SYSTEM")
                    .note(note)
                    .createdAt(LocalDateTime.now())
                    .build();
            orderStatusHistoryRepository.save(history);
        } catch (Exception ex) {
            log.error("Failed to record status history for order {}: {}", order.getOrderNumber(), ex.getMessage());
        }
    }

    private static final BigDecimal FREESHIP_THRESHOLD = new BigDecimal("500000.00");
    private static final BigDecimal STANDARD_SHIPPING_FEE = new BigDecimal("30000.00");

    // Idempotency cache for preventing duplicate orders on retry (stores for 10 minutes)
    private final Map<String, IdempotencyRecord> idempotencyCache = new ConcurrentHashMap<>();

    private record IdempotencyRecord(OrderResponse response, LocalDateTime expiresAt) {}

    @Override
    @Transactional(readOnly = true)
    public CheckoutSummaryResponse getCheckoutSummary(String userEmail) {
        User user = getUserByEmail(userEmail);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Giỏ hàng của bạn đang trống"));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Giỏ hàng của bạn đang trống, vui lòng chọn sách trước khi xem tóm tắt đơn");
        }

        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItemsCount = 0;

        for (CartItem item : cartItems) {
            Book book = item.getBook();
            BigDecimal unitPrice = book.getSalePrice();
            int qty = item.getQuantity();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));

            int availableStock = inventoryRepository.findByBookId(book.getId())
                    .map(Inventory::getAvailableQuantity)
                    .orElse(0);

            itemResponses.add(CartItemResponse.builder()
                    .id(item.getId())
                    .bookId(book.getId())
                    .bookTitle(book.getTitle())
                    .bookSlug(book.getSlug())
                    .bookCover(book.getCoverImage())
                    .unitPrice(unitPrice)
                    .originalPrice(book.getOriginalPrice())
                    .quantity(qty)
                    .totalPrice(lineTotal)
                    .stockQuantity(availableStock)
                    .isAvailable(availableStock >= qty && book.getStatus() == Book.BookStatus.PUBLISHED)
                    .build());

            subtotal = subtotal.add(lineTotal);
            totalItemsCount += qty;
        }

        boolean isFreeShipping = subtotal.compareTo(FREESHIP_THRESHOLD) >= 0;
        BigDecimal shippingFee = isFreeShipping ? BigDecimal.ZERO : STANDARD_SHIPPING_FEE;
        BigDecimal totalAmount = subtotal.add(shippingFee);

        List<Address> addresses = addressRepository.findByUserId(user.getId());
        List<AddressResponse> addressResponses = addresses.stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());

        AddressResponse defaultAddress = addressResponses.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .findFirst()
                .orElse(addressResponses.isEmpty() ? null : addressResponses.get(0));

        return CheckoutSummaryResponse.builder()
                .items(itemResponses)
                .totalItems(totalItemsCount)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .isFreeShipping(isFreeShipping)
                .totalAmount(totalAmount)
                .savedAddresses(addressResponses)
                .defaultAddress(defaultAddress)
                .supportedPaymentMethods(List.of("COD"))
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse createOrder(String userEmail, CreateOrderRequest request) {
        // 1. Check Idempotency Key to prevent duplicate order submissions
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            String key = userEmail + ":" + request.getIdempotencyKey().trim();
            cleanExpiredIdempotency();
            IdempotencyRecord record = idempotencyCache.get(key);
            if (record != null && record.expiresAt().isAfter(LocalDateTime.now())) {
                log.info("Idempotent request intercepted for key {}. Returning cached order {}.", key, record.response().getOrderNumber());
                return record.response();
            }
        }

        // 2. Fetch User and Cart
        User user = getUserByEmail(userEmail);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Giỏ hàng của bạn đang trống, không thể tiến hành đặt hàng"));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Giỏ hàng của bạn đang trống, không thể tiến hành đặt hàng");
        }

        // 3. Resolve Shipping Address & Security Check
        String receiverName;
        String receiverPhone;
        String shippingAddress;

        if (request.getAddressId() != null) {
            Address address = addressRepository.findById(request.getAddressId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ giao hàng với ID: " + request.getAddressId()));

            // Security: Prevent using someone else's address
            if (!address.getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Bạn không có quyền sử dụng địa chỉ giao hàng của người khác");
            }

            receiverName = address.getReceiverName();
            receiverPhone = address.getPhone();
            shippingAddress = String.format("%s, %s, %s, %s",
                    address.getDetailedAddress(), address.getWard(), address.getDistrict(), address.getProvince());
        } else {
            // Validate direct address input
            if (request.getReceiverName() == null || request.getReceiverName().trim().isEmpty()) {
                throw new BadRequestException("Tên người nhận không được để trống");
            }
            if (request.getReceiverPhone() == null || request.getReceiverPhone().trim().isEmpty()) {
                throw new BadRequestException("Số điện thoại người nhận không được để trống");
            }

            receiverName = request.getReceiverName().trim();
            receiverPhone = request.getReceiverPhone().trim();

            if (request.getShippingAddress() != null && !request.getShippingAddress().trim().isEmpty()) {
                shippingAddress = request.getShippingAddress().trim();
            } else if (request.getDetailedAddress() != null && request.getProvince() != null) {
                shippingAddress = String.format("%s, %s, %s, %s",
                        request.getDetailedAddress().trim(),
                        request.getWard() != null ? request.getWard().trim() : "",
                        request.getDistrict() != null ? request.getDistrict().trim() : "",
                        request.getProvince().trim());
            } else {
                throw new BadRequestException("Địa chỉ giao hàng không được để trống");
            }
        }

        // 4. Calculate Subtotal and Verify Inventory
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderLinePreparation> linePreparations = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            Book book = cartItem.getBook();

            if (book.getStatus() != Book.BookStatus.PUBLISHED) {
                throw new BadRequestException("Tác phẩm '" + book.getTitle() + "' hiện không mở bán");
            }

            Inventory inventory = inventoryRepository.findByBookIdForUpdate(book.getId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin tồn kho của tác phẩm: " + book.getTitle()));

            int availableStock = inventory.getAvailableQuantity();
            int requestedQuantity = cartItem.getQuantity();

            if (requestedQuantity > availableStock) {
                throw new BadRequestException("Tác phẩm '" + book.getTitle() + "' không đủ số lượng tồn kho khả dụng (Yêu cầu " + requestedQuantity + " cuốn, tồn kho chỉ còn " + availableStock + " cuốn)");
            }

            BigDecimal unitPrice = book.getSalePrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(requestedQuantity));
            subtotal = subtotal.add(lineTotal);

            linePreparations.add(new OrderLinePreparation(book, inventory, requestedQuantity, unitPrice, lineTotal));
        }

        // 5. Calculate Final Fees and Apply Coupon
        boolean isFreeShipping = subtotal.compareTo(FREESHIP_THRESHOLD) >= 0;
        BigDecimal shippingFee = isFreeShipping ? BigDecimal.ZERO : STANDARD_SHIPPING_FEE;

        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCouponCode = null;
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            appliedCouponCode = request.getCouponCode().trim().toUpperCase(Locale.ROOT);
            discountAmount = couponService.calculateAndApplyCoupon(appliedCouponCode, subtotal, user.getEmail());
        }

        BigDecimal totalAmount = subtotal.add(shippingFee).subtract(discountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        // 6. Generate Unique Order Number
        String orderNumber = generateUniqueOrderNumber();

        // 7. Persist Order Entity
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(discountAmount)
                .couponCode(appliedCouponCode)
                .totalAmount(totalAmount)
                .status(Order.OrderStatus.PENDING)
                .receiverName(receiverName)
                .receiverPhone(receiverPhone)
                .shippingAddress(shippingAddress)
                .note(request.getNote())
                .build();

        Order savedOrder = orderRepository.save(order);

        // 8. Persist OrderItem Snapshots and Safely Deduct Inventory
        List<OrderItem> savedItems = new ArrayList<>();
        for (OrderLinePreparation prep : linePreparations) {
            Book book = prep.book();
            Inventory inventory = prep.inventory();
            int qty = prep.quantity();

            // Create OrderItem with immutable snapshot values
            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .book(book)
                    .bookTitle(book.getTitle())
                    .bookCover(book.getCoverImage())
                    .price(prep.unitPrice())
                    .quantity(qty)
                    .totalPrice(prep.lineTotal())
                    .build();
            savedItems.add(orderItemRepository.save(orderItem));

            // Deduct inventory quantity
            int oldQuantity = inventory.getQuantity();
            int newQuantity = oldQuantity - qty;
            inventory.setQuantity(newQuantity);
            inventoryRepository.save(inventory);

            // Log inventory transaction for audit trail
            InventoryTransaction transaction = InventoryTransaction.builder()
                    .book(book)
                    .transactionType(InventoryTransaction.TransactionType.SALE)
                    .quantityChange(-qty)
                    .remainingQuantity(newQuantity)
                    .performedBy(user.getEmail())
                    .note("Bán theo đơn hàng #" + orderNumber)
                    .build();
            inventoryTransactionRepository.save(transaction);
        }

        // 9. Create Payment Record
        Payment.PaymentMethod method = Payment.PaymentMethod.COD;
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            try {
                method = Payment.PaymentMethod.valueOf(request.getPaymentMethod().trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        String paymentNote = switch (method) {
            case VNPAY -> "Thanh toán trực tuyến qua cổng VNPAY";
            case BANK_TRANSFER -> "Thanh toán chuyển khoản ngân hàng";
            default -> "Thanh toán tiền mặt khi nhận hàng (COD)";
        };

        Payment payment = Payment.builder()
                .order(savedOrder)
                .paymentMethod(method)
                .paymentStatus(Payment.PaymentStatus.UNPAID)
                .amount(totalAmount)
                .note(paymentNote)
                .build();
        paymentRepository.save(payment);

        // 10. Clean up user's cart items after successful order creation
        cartItemRepository.deleteByCartId(cart.getId());

        savedOrder.setItems(savedItems);

        // Record initial status history
        recordStatusHistory(savedOrder, null, OrderStatus.PENDING.name(), "TẠO ĐƠN HÀNG MỚI", userEmail, "Khách hàng tạo đơn hàng trực tuyến");

        OrderResponse response = mapToOrderResponse(savedOrder, method.name(), "UNPAID");

        // 11. Cache Idempotency key if provided
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            String key = userEmail + ":" + request.getIdempotencyKey().trim();
            idempotencyCache.put(key, new IdempotencyRecord(response, LocalDateTime.now().plusMinutes(10)));
        }

        log.info("Order created successfully: {} for user {}. Total amount: {}", orderNumber, userEmail, totalAmount);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByOrderNumber(String userEmail, String orderNumber) {
        User user = getUserByEmail(userEmail);
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderNumber));

        boolean isAdminOrStaff = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_STAFF"));

        if (!isAdminOrStaff && !order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập vào đơn hàng này");
        }

        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        String paymentMethod = payment != null ? payment.getPaymentMethod().name() : "COD";
        String paymentStatus = payment != null ? payment.getPaymentStatus().name() : "UNPAID";

        return mapToOrderResponse(order, paymentMethod, paymentStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(String userEmail, int page, int size) {
        return getMyOrders(userEmail, null, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(String userEmail, OrderStatus status, int page, int size) {
        User user = getUserByEmail(userEmail);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Order> orderPage = (status != null)
                ? orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status, pageable)
                : orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        List<OrderResponse> responses = orderPage.getContent().stream()
                .map(o -> {
                    Payment p = paymentRepository.findByOrderId(o.getId()).stream().findFirst().orElse(null);
                    String pm = p != null ? p.getPaymentMethod().name() : "COD";
                    String ps = p != null ? p.getPaymentStatus().name() : "UNPAID";
                    return mapToOrderResponse(o, pm, ps);
                })
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(responses)
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .isFirst(orderPage.isFirst())
                .isLast(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(String userEmail, String orderNumber, CancelOrderRequest request) {
        User user = getUserByEmail(userEmail);
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderNumber));

        boolean isAdminOrStaff = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_STAFF"));

        if (!isAdminOrStaff && !order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn hàng này");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng này đã được hủy trước đó");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Đơn hàng đã được giao thành công, không thể hủy. Vui lòng liên hệ để thực hiện hoàn tiền/đổi trả.");
        }

        if (order.getStatus() == OrderStatus.REFUNDED) {
            throw new BadRequestException("Đơn hàng đã ở trạng thái hoàn tiền, không thể hủy.");
        }

        // Khách hàng chỉ được phép hủy khi đơn ở trạng thái PENDING
        if (!isAdminOrStaff && order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Không thể hủy đơn hàng vì đơn đã ở trạng thái: " + order.getStatus().name() + ". Vui lòng liên hệ bộ phận hỗ trợ.");
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason().trim()
                : (isAdminOrStaff ? "Admin/Nhân viên hủy đơn" : "Khách hàng hủy đơn");
        String currentNote = order.getNote() != null ? order.getNote() : "";
        order.setNote((currentNote.isBlank() ? "" : currentNote + " | ") + "[Hủy bởi " + (isAdminOrStaff ? "Quản trị: " : "Khách: ") + reason + "]");

        // Hoàn kho an toàn (Chống hoàn kho lặp với cờ inventoryRestored)
        if (!Boolean.TRUE.equals(order.getInventoryRestored())) {
            for (OrderItem item : order.getItems()) {
                if (item.getBook() != null) {
                    Inventory inv = inventoryRepository.findByBookIdForUpdate(item.getBook().getId()).orElse(null);
                    if (inv != null) {
                        inv.setQuantity(inv.getQuantity() + item.getQuantity());
                        inventoryRepository.save(inv);

                        InventoryTransaction tx = InventoryTransaction.builder()
                                .book(item.getBook())
                                .transactionType(TransactionType.CANCEL_RETURN)
                                .quantityChange(item.getQuantity())
                                .remainingQuantity(inv.getQuantity())
                                .performedBy(userEmail)
                                .note("Hoàn kho do hủy đơn " + order.getOrderNumber() + ": " + reason)
                                .createdAt(LocalDateTime.now())
                                .build();
                        inventoryTransactionRepository.save(tx);
                    }
                }
            }
            order.setInventoryRestored(true);
        }

        // Giải phóng lượt dùng của mã giảm giá (nếu có)
        if (order.getCouponCode() != null && !order.getCouponCode().isBlank()) {
            couponService.releaseCoupon(order.getCouponCode());
        }

        orderRepository.save(order);

        // Ghi lịch sử thao tác
        recordStatusHistory(order, oldStatus.name(), OrderStatus.CANCELLED.name(), "HỦY ĐƠN HÀNG", userEmail, reason);
        log.info("Order {} cancelled by {}. Inventory restored.", order.getOrderNumber(), userEmail);

        auditLogService.log(userEmail, "ORDER_CANCEL", "ORDER", order.getOrderNumber(),
                "Hủy đơn hàng: " + order.getOrderNumber(),
                "Lý do: " + reason + ", Tồn kho đã hoàn: " + order.getInventoryRestored());

        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        String paymentMethod = payment != null ? payment.getPaymentMethod().name() : "COD";
        String paymentStatus = payment != null ? payment.getPaymentStatus().name() : "UNPAID";

        return mapToOrderResponse(order, paymentMethod, paymentStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrdersForAdmin(OrderStatus status, String keyword, int page, int size) {
        return getAllOrdersForAdmin(status, keyword, null, null, null, null, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrdersForAdmin(
            OrderStatus status,
            String keyword,
            String paymentMethodStr,
            String paymentStatusStr,
            LocalDateTime startDate,
            LocalDateTime endDate,
            int page,
            int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;

        Payment.PaymentMethod pm = null;
        if (paymentMethodStr != null && !paymentMethodStr.isBlank() && !paymentMethodStr.equalsIgnoreCase("ALL")) {
            try {
                pm = Payment.PaymentMethod.valueOf(paymentMethodStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        Payment.PaymentStatus ps = null;
        if (paymentStatusStr != null && !paymentStatusStr.isBlank() && !paymentStatusStr.equalsIgnoreCase("ALL")) {
            try {
                ps = Payment.PaymentStatus.valueOf(paymentStatusStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        Page<Order> orderPage = orderRepository.findOrdersWithAdvancedFilter(status, startDate, endDate, pm, ps, kw, pageable);

        List<OrderResponse> responses = orderPage.getContent().stream()
                .map(o -> {
                    Payment p = paymentRepository.findByOrderId(o.getId()).stream().findFirst().orElse(null);
                    String pMethod = p != null ? p.getPaymentMethod().name() : "COD";
                    String pStatus = p != null ? p.getPaymentStatus().name() : "UNPAID";
                    return mapToOrderResponse(o, pMethod, pStatus);
                })
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(responses)
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .isFirst(orderPage.isFirst())
                .isLast(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse updateOrderStatusForAdmin(String orderNumber, UpdateOrderStatusRequest request, String adminEmail) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderNumber));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus = request.getNewStatus();

        if (currentStatus == newStatus) {
            Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
            return mapToOrderResponse(order, payment != null ? payment.getPaymentMethod().name() : "COD", payment != null ? payment.getPaymentStatus().name() : "UNPAID");
        }

        // State Machine validation
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng đã ở trạng thái ĐÃ HỦY, không thể thay đổi trạng thái nữa");
        }

        if (currentStatus == OrderStatus.REFUNDED) {
            throw new BadRequestException("Đơn hàng đã ở trạng thái ĐÃ HOÀN TIỀN, không thể thay đổi trạng thái nữa");
        }

        if (currentStatus == OrderStatus.DELIVERED && newStatus != OrderStatus.REFUNDED) {
            throw new BadRequestException("Đơn hàng đã GIAO THÀNH CÔNG, chỉ có thể chuyển sang HOÀN TIỀN (REFUNDED) nếu phát sinh đổi trả");
        }

        boolean isValid = false;
        switch (currentStatus) {
            case PENDING -> isValid = (newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.CANCELLED);
            case CONFIRMED -> isValid = (newStatus == OrderStatus.SHIPPING || newStatus == OrderStatus.CANCELLED);
            case SHIPPING -> isValid = (newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED);
            case DELIVERED -> isValid = (newStatus == OrderStatus.REFUNDED);
            default -> isValid = false;
        }

        if (!isValid) {
            throw new BadRequestException("Không thể chuyển trạng thái đơn hàng từ " + currentStatus + " sang " + newStatus);
        }

        // Nếu chuyển sang CANCELLED hoặc REFUNDED: hoàn kho an toàn (chống lặp)
        if (newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED) {
            if (!Boolean.TRUE.equals(order.getInventoryRestored())) {
                for (OrderItem item : order.getItems()) {
                    if (item.getBook() != null) {
                        Inventory inv = inventoryRepository.findByBookIdForUpdate(item.getBook().getId()).orElse(null);
                        if (inv != null) {
                            inv.setQuantity(inv.getQuantity() + item.getQuantity());
                            inventoryRepository.save(inv);

                            InventoryTransaction tx = InventoryTransaction.builder()
                                    .book(item.getBook())
                                    .transactionType(TransactionType.CANCEL_RETURN)
                                    .quantityChange(item.getQuantity())
                                    .remainingQuantity(inv.getQuantity())
                                    .performedBy(adminEmail)
                                    .note("Hoàn kho do quản trị chuyển đơn sang " + newStatus + ": " + order.getOrderNumber())
                                    .createdAt(LocalDateTime.now())
                                    .build();
                            inventoryTransactionRepository.save(tx);
                        }
                    }
                }
                order.setInventoryRestored(true);
            }
        }

        // Nếu chuyển sang DELIVERED: Chỉ tự động cập nhật thanh toán COD thành PAID
        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        if (newStatus == OrderStatus.DELIVERED) {
            if (payment != null && payment.getPaymentMethod() == Payment.PaymentMethod.COD && payment.getPaymentStatus() == PaymentStatus.UNPAID) {
                payment.setPaymentStatus(PaymentStatus.PAID);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                recordStatusHistory(order, currentStatus.name(), newStatus.name(), "THANH TOÁN COD", adminEmail, "Tự động ghi nhận thu tiền mặt COD khi giao thành công");
            }
        }

        order.setStatus(newStatus);
        if (request.getNote() != null && !request.getNote().isBlank()) {
            String existing = order.getNote() != null ? order.getNote() : "";
            order.setNote((existing.isBlank() ? "" : existing + " | ") + "[QL " + adminEmail + ": " + request.getNote().trim() + "]");
        }
        orderRepository.save(order);

        // Ghi lịch sử chuyển trạng thái
        recordStatusHistory(order, currentStatus.name(), newStatus.name(), "CHUYỂN TRẠNG THÁI", adminEmail, request.getNote());
        log.info("Order {} status changed from {} to {} by {}", orderNumber, currentStatus, newStatus, adminEmail);

        auditLogService.log(adminEmail, "ORDER_STATUS_UPDATE", "ORDER", orderNumber,
                "Cập nhật trạng thái đơn: " + orderNumber + " (" + currentStatus + " -> " + newStatus + ")",
                "Trạng thái mới: " + newStatus + (request.getNote() != null ? ", Ghi chú: " + request.getNote() : ""));

        String paymentMethod = payment != null ? payment.getPaymentMethod().name() : "COD";
        String paymentStatus = payment != null ? payment.getPaymentStatus().name() : "UNPAID";

        return mapToOrderResponse(order, paymentMethod, paymentStatus);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse updatePaymentStatusForAdmin(String orderNumber, com.novelia.order.dto.UpdatePaymentStatusRequest request, String adminEmail) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderNumber));

        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        if (payment == null) {
            payment = Payment.builder()
                    .order(order)
                    .paymentMethod(Payment.PaymentMethod.COD)
                    .paymentStatus(PaymentStatus.UNPAID)
                    .amount(order.getTotalAmount())
                    .build();
        }

        PaymentStatus currentPaymentStatus = payment.getPaymentStatus();
        PaymentStatus newPaymentStatus = request.getNewStatus();

        if (currentPaymentStatus != newPaymentStatus) {
            payment.setPaymentStatus(newPaymentStatus);
            if (newPaymentStatus == PaymentStatus.PAID && payment.getPaidAt() == null) {
                payment.setPaidAt(LocalDateTime.now());
            }
            if (request.getTransactionCode() != null && !request.getTransactionCode().isBlank()) {
                payment.setTransactionCode(request.getTransactionCode().trim());
            }
            if (request.getNote() != null && !request.getNote().isBlank()) {
                payment.setNote(request.getNote().trim());
            }
            paymentRepository.save(payment);

            recordStatusHistory(order, order.getStatus().name(), order.getStatus().name(),
                    "CẬP NHẬT THANH TOÁN", adminEmail,
                    "Chuyển trạng thái thanh toán từ " + currentPaymentStatus + " sang " + newPaymentStatus +
                    (request.getTransactionCode() != null && !request.getTransactionCode().isBlank() ? " | Mã GD: " + request.getTransactionCode().trim() : "") +
                    (request.getNote() != null && !request.getNote().isBlank() ? " | Ghi chú: " + request.getNote().trim() : ""));
            log.info("Payment for order {} updated from {} to {} by {}", orderNumber, currentPaymentStatus, newPaymentStatus, adminEmail);

            auditLogService.log(adminEmail, "ORDER_PAYMENT_UPDATE", "ORDER", orderNumber,
                    "Cập nhật thanh toán đơn: " + orderNumber + " (" + currentPaymentStatus + " -> " + newPaymentStatus + ")",
                    "Trạng thái thanh toán mới: " + newPaymentStatus + ", Mã GD: " + payment.getTransactionCode());
        }

        return mapToOrderResponse(order, payment.getPaymentMethod().name(), payment.getPaymentStatus().name());
    }

    private synchronized String generateUniqueOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String orderNumber;
        do {
            String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
            orderNumber = "NOV-" + datePart + "-" + randomPart;
        } while (orderRepository.findByOrderNumber(orderNumber).isPresent());
        return orderNumber;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    private void cleanExpiredIdempotency() {
        LocalDateTime now = LocalDateTime.now();
        idempotencyCache.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private AddressResponse mapToAddressResponse(Address a) {
        String full = String.format("%s, %s, %s, %s",
                a.getDetailedAddress(), a.getWard(), a.getDistrict(), a.getProvince());
        return AddressResponse.builder()
                .id(a.getId())
                .receiverName(a.getReceiverName())
                .phone(a.getPhone())
                .province(a.getProvince())
                .district(a.getDistrict())
                .ward(a.getWard())
                .detailedAddress(a.getDetailedAddress())
                .fullAddress(full)
                .isDefault(a.getIsDefault())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private OrderResponse mapToOrderResponse(Order order, String paymentMethod, String paymentStatus) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .bookId(item.getBook() != null ? item.getBook().getId() : null)
                        .bookTitle(item.getBookTitle())
                        .bookCover(item.getBookCover())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        String txCode = payment != null ? payment.getTransactionCode() : null;
        LocalDateTime paidAt = payment != null ? payment.getPaidAt() : null;

        List<OrderStatusHistoryResponse> historyResponses = Collections.emptyList();
        try {
            historyResponses = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId()).stream()
                    .map(h -> OrderStatusHistoryResponse.builder()
                            .id(h.getId())
                            .fromStatus(h.getFromStatus())
                            .toStatus(h.getToStatus())
                            .action(h.getAction())
                            .changedBy(h.getChangedBy())
                            .note(h.getNote())
                            .createdAt(h.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception ex) {
            log.warn("Could not load order histories for {}: {}", order.getOrderNumber(), ex.getMessage());
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .couponCode(order.getCouponCode())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .paymentTransactionCode(txCode)
                .paidAt(paidAt)
                .inventoryRestored(order.getInventoryRestored())
                .items(itemResponses)
                .histories(historyResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private record OrderLinePreparation(Book book, Inventory inventory, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}
}
