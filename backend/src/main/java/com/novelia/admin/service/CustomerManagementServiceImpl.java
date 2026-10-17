package com.novelia.admin.service;

import com.novelia.admin.dto.CustomerDetailResponse;
import com.novelia.admin.dto.CustomerManagementResponse;
import com.novelia.admin.dto.UpdateCustomerStatusRequest;
import com.novelia.common.dto.PageResponse;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.order.dto.OrderItemResponse;
import com.novelia.order.dto.OrderResponse;
import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.payment.entity.Payment;
import com.novelia.payment.repository.PaymentRepository;
import com.novelia.user.dto.AddressResponse;
import com.novelia.user.entity.Address;
import com.novelia.user.entity.Role;
import com.novelia.user.entity.User;
import com.novelia.user.repository.AddressRepository;
import com.novelia.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CustomerManagementServiceImpl implements CustomerManagementService {

    private static final Set<Order.OrderStatus> VALID_REVENUE_STATUSES = Set.of(
            Order.OrderStatus.CONFIRMED,
            Order.OrderStatus.SHIPPING,
            Order.OrderStatus.DELIVERED
    );

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final PaymentRepository paymentRepository;
    private final com.novelia.audit.service.AuditLogService auditLogService;

    public CustomerManagementServiceImpl(
            UserRepository userRepository,
            OrderRepository orderRepository,
            AddressRepository addressRepository,
            PaymentRepository paymentRepository,
            com.novelia.audit.service.AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.addressRepository = addressRepository;
        this.paymentRepository = paymentRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerManagementResponse> getCustomers(String keyword, int page, int size) {
        return getCustomers(keyword, null, null, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerManagementResponse> getCustomers(String keyword, String statusStr, String roleStr, int page, int size) {
        int pageIndex = Math.max(0, page);
        int pageSize = Math.max(1, size);
        String search = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        User.UserStatus userStatus = null;
        if (statusStr != null && !statusStr.isBlank() && !statusStr.equalsIgnoreCase("ALL")) {
            try {
                userStatus = User.UserStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        String roleName = null;
        if (roleStr != null && !roleStr.isBlank() && !roleStr.equalsIgnoreCase("ALL")) {
            String clean = roleStr.trim().toUpperCase();
            roleName = clean.startsWith("ROLE_") ? clean : "ROLE_" + clean;
        }

        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.searchUsersWithFilter(search, userStatus, roleName, pageable);

        List<CustomerManagementResponse> list = userPage.getContent().stream()
                .map(this::mapToCustomerResponse)
                .collect(Collectors.toList());

        return PageResponse.<CustomerManagementResponse>builder()
                .content(list)
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .isFirst(userPage.isFirst())
                .isLast(userPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailResponse getCustomerDetails(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        // 1. Thống kê số lượng đơn và chi tiêu thực tế (không tự sinh số ảo)
        long totalOrders = orderRepository.countByUserId(user.getId());
        long completedOrders = orderRepository.countByStatus(Order.OrderStatus.DELIVERED); // hoặc lọc từ đơn của user
        List<Order> userOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 10)).getContent();

        long completedUserOrders = userOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED).count();
        long cancelledUserOrders = userOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.CANCELLED).count();

        BigDecimal totalSpent = orderRepository.calculateSpentByUserId(user.getId(), VALID_REVENUE_STATUSES);
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        LocalDateTime lastOrderDate = userOrders.isEmpty() ? null : userOrders.get(0).getCreatedAt();

        // 2. Danh sách địa chỉ đã lưu
        List<AddressResponse> addressResponses = addressRepository.findByUserId(user.getId()).stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());

        // 3. Lịch sử đơn hàng gần nhất
        List<OrderResponse> recentOrderResponses = userOrders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return CustomerDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus().name())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalOrders(totalOrders)
                .completedOrders(completedUserOrders)
                .cancelledOrders(cancelledUserOrders)
                .totalSpent(totalSpent)
                .lastOrderDate(lastOrderDate)
                .addresses(addressResponses)
                .recentOrders(recentOrderResponses)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerManagementResponse updateCustomerStatus(Long id, UpdateCustomerStatusRequest request, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        User.UserStatus newStatus;
        try {
            newStatus = User.UserStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái người dùng không hợp lệ: " + request.getStatus() +
                    ". Các giá trị hợp lệ: ACTIVE, INACTIVE, LOCKED");
        }

        // 1. Quy tắc an toàn: Ngăn Admin tự khóa hoặc hạ quyền của chính mình
        if (currentAdminEmail != null && user.getEmail().equalsIgnoreCase(currentAdminEmail.trim())) {
            if (newStatus == User.UserStatus.LOCKED || newStatus == User.UserStatus.INACTIVE) {
                throw new BadRequestException("Bạn không thể tự khóa hoặc vô hiệu hóa tài khoản quản trị của chính mình!");
            }
        }

        // 2. Quy tắc an toàn: Ngăn khóa tài khoản Quản trị viên (ROLE_ADMIN) duy nhất còn hoạt động
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (isAdmin && (newStatus == User.UserStatus.LOCKED || newStatus == User.UserStatus.INACTIVE)) {
            long activeAdminCount = userRepository.countByRoles_NameAndStatus("ROLE_ADMIN", User.UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new BadRequestException("Không thể khóa tài khoản quản trị viên duy nhất còn hoạt động trong hệ thống!");
            }
        }

        user.setStatus(newStatus);
        User saved = userRepository.save(user);
        log.info("User {} (ID: {}) status updated to {} by admin {}. Reason: {}",
                user.getEmail(), user.getId(), newStatus, currentAdminEmail, request.getReason());

        auditLogService.log(currentAdminEmail, "USER_STATUS_UPDATE", "USER", user.getId().toString(),
                "Cập nhật trạng thái người dùng: " + user.getEmail() + " -> " + newStatus,
                "Lý do: " + request.getReason() + ", Vai trò: " + user.getRoles().stream().map(Role::getName).collect(Collectors.joining(",")));

        return mapToCustomerResponse(saved);
    }

    private CustomerManagementResponse mapToCustomerResponse(User user) {
        long totalOrders = orderRepository.countByUserId(user.getId());
        BigDecimal totalSpent = orderRepository.calculateSpentByUserId(user.getId(), VALID_REVENUE_STATUSES);
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return CustomerManagementResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus().name())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .totalOrders(totalOrders)
                .totalSpent(totalSpent)
                .build();
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

    private OrderResponse mapToOrderResponse(Order order) {
        Payment payment = paymentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        String pm = payment != null ? payment.getPaymentMethod().name() : "COD";
        String ps = payment != null ? payment.getPaymentStatus().name() : "UNPAID";

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
                .paymentMethod(pm)
                .paymentStatus(ps)
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
