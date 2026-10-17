package com.novelia.shipment.service;

import com.novelia.audit.service.AuditLogService;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.shipment.config.ShippingProperties;
import com.novelia.shipment.dto.*;
import com.novelia.shipment.entity.Shipment;
import com.novelia.shipment.repository.ShipmentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class ShippingCarrierServiceImpl implements ShippingCarrierService {

    private final ShippingProperties shippingProperties;
    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;
    private final GhnApiClient ghnApiClient;

    public ShippingCarrierServiceImpl(
            ShippingProperties shippingProperties,
            ShipmentRepository shipmentRepository,
            OrderRepository orderRepository,
            AuditLogService auditLogService,
            GhnApiClient ghnApiClient) {
        this.shippingProperties = shippingProperties;
        this.shipmentRepository = shipmentRepository;
        this.orderRepository = orderRepository;
        this.auditLogService = auditLogService;
        this.ghnApiClient = ghnApiClient;
    }

    @Override
    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + request.getOrderId()));

        if (order.getStatus() == Order.OrderStatus.CANCELLED || order.getStatus() == Order.OrderStatus.REFUNDED) {
            throw new BadRequestException("Không thể tạo vận đơn cho đơn hàng đã hủy hoặc đã hoàn tiền");
        }

        // Check if shipment already exists (Idempotency - chống tạo vận đơn trùng lặp)
        Shipment existing = shipmentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
        if (existing != null) {
            log.info("Shipment idempotency check: Order #{} already has shipment ID {}. Returning existing shipment.", order.getOrderNumber(), existing.getId());
            return mapToResponse(existing);
        }

        boolean liveConnected = shippingProperties.isLiveCredentialsConfigured();
        String trackingNumber = null;
        String note;

        if (liveConnected) {
            log.info("Live credentials present. Calling carrier API for order #{}...", order.getOrderNumber());
            Map<String, Object> orderPayload = new HashMap<>();
            orderPayload.put("to_name", order.getReceiverName());
            orderPayload.put("to_phone", order.getReceiverPhone());
            orderPayload.put("to_address", order.getShippingAddress());
            orderPayload.put("client_order_code", order.getOrderNumber());
            orderPayload.put("weight", 500);

            Optional<String> liveOrderCode = ghnApiClient.createShippingOrder(orderPayload);
            if (liveOrderCode.isPresent()) {
                trackingNumber = liveOrderCode.get();
                note = "Đã kết nối thành công tới cổng live GHN. Mã vận đơn bưu cục cấp: " + trackingNumber;
            } else {
                trackingNumber = null;
                note = "Kết nối cổng GHN thất bại hoặc đang bảo trì. Vận đơn lưu ở trạng thái chờ kết nối lại.";
            }
        } else {
            // IMPORTANT: Strictly DO NOT generate fake tracking codes (e.g. no random 'GHN99999')
            trackingNumber = null;
            note = "Khung chuẩn bị tích hợp GHN: Đang chờ cấu hình Live API Token và Shop ID từ nhà vận chuyển. Chưa tạo mã vận đơn để bảo đảm tính trung thực của dữ liệu.";
            log.info("Shipping carrier credentials NOT configured. Created shipment record without fake tracking number for order #{}", order.getOrderNumber());
        }

        Shipment shipment = Shipment.builder()
                .order(order)
                .trackingNumber(trackingNumber)
                .shippingCarrier(request.getCarrierName() != null ? request.getCarrierName() : shippingProperties.getCarrierName())
                .shippingStatus(Shipment.ShippingStatus.PENDING)
                .estimatedDelivery(LocalDateTime.now().plusDays(3))
                .note(request.getNote() != null ? request.getNote() : note)
                .build();

        Shipment saved = shipmentRepository.save(shipment);

        // Update order status to SHIPPING if it was CONFIRMED
        if (order.getStatus() == Order.OrderStatus.CONFIRMED) {
            order.setStatus(Order.OrderStatus.SHIPPING);
            orderRepository.save(order);
        }

        auditLogService.log(
                "SYSTEM",
                "CREATE_SHIPMENT",
                "Shipment",
                String.valueOf(saved.getId()),
                "Tạo vận đơn cho đơn hàng #" + order.getOrderNumber(),
                "Nhà vận chuyển: " + saved.getShippingCarrier() + ", Mã VĐ: " + (trackingNumber != null ? trackingNumber : "Chưa cấp (Chế độ chuẩn bị)")
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentByOrderId(Long orderId) {
        Shipment shipment = shipmentRepository.findByOrderId(orderId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có thông tin vận đơn cho đơn hàng ID: " + orderId));
        return mapToResponse(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse trackShipment(String trackingNumber) {
        if (trackingNumber == null || trackingNumber.trim().isEmpty()) {
            throw new BadRequestException("Mã vận đơn không được để trống");
        }
        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin vận đơn với mã: " + trackingNumber));
        return mapToResponse(shipment);
    }

    @Override
    @Transactional
    public ShipmentResponse updateShipmentStatus(Long shipmentId, UpdateShipmentStatusRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vận đơn với ID: " + shipmentId));

        shipment.setShippingStatus(request.getShippingStatus());
        if (request.getNote() != null) {
            shipment.setNote(request.getNote());
        }
        if (request.getActualDelivery() != null) {
            shipment.setActualDelivery(request.getActualDelivery());
        } else if (request.getShippingStatus() == Shipment.ShippingStatus.DELIVERED) {
            shipment.setActualDelivery(LocalDateTime.now());
        }

        Shipment saved = shipmentRepository.save(shipment);

        // Synchronize Order status
        Order order = shipment.getOrder();
        if (request.getShippingStatus() == Shipment.ShippingStatus.DELIVERED) {
            order.setStatus(Order.OrderStatus.DELIVERED);
            orderRepository.save(order);
        }

        auditLogService.log(
                "STAFF",
                "UPDATE_SHIPMENT_STATUS",
                "Shipment",
                String.valueOf(shipmentId),
                "Cập nhật trạng thái vận đơn #" + shipment.getId() + " sang " + request.getShippingStatus(),
                "Ghi chú: " + request.getNote()
        );

        log.info("Updated shipment ID {} status to {}", shipmentId, request.getShippingStatus());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShipmentResponse> getAllShipments(Pageable pageable) {
        return shipmentRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ShippingFeeCalculateResponse calculateShippingFee(ShippingFeeCalculateRequest request) {
        int weight = (request.getWeightGrams() != null && request.getWeightGrams() > 0) ? request.getWeightGrams() : 500;
        BigDecimal orderAmount = request.getOrderAmount() != null ? request.getOrderAmount() : BigDecimal.ZERO;

        // 1. Phí cơ bản mặc định theo chính sách bán sách của Novelia Books
        String province = request.getToProvince() != null ? request.getToProvince().trim().toLowerCase() : "";
        boolean isMajorCity = province.contains("hà nội") || province.contains("ha noi")
                || province.contains("hồ chí minh") || province.contains("ho chi minh") || province.contains("hcm");

        BigDecimal baseFee;
        int estimatedDays;

        if (isMajorCity) {
            // Nội thành: 25.000 VNĐ cho 1000g đầu, +5.000 VNĐ mỗi 500g phụ trội
            int extraWeight = Math.max(0, weight - 1000);
            int extraUnits = (int) Math.ceil((double) extraWeight / 500.0);
            baseFee = new BigDecimal("25000").add(new BigDecimal("5000").multiply(BigDecimal.valueOf(extraUnits)));
            estimatedDays = 2;
        } else {
            // Liên tỉnh: 35.000 VNĐ cho 1000g đầu, +10.000 VNĐ mỗi 500g phụ trội
            int extraWeight = Math.max(0, weight - 1000);
            int extraUnits = (int) Math.ceil((double) extraWeight / 500.0);
            baseFee = new BigDecimal("35000").add(new BigDecimal("10000").multiply(BigDecimal.valueOf(extraUnits)));
            estimatedDays = 4;
        }

        String calcMethod = "NOVELIA_STANDARD_POLICY";
        boolean liveConnected = shippingProperties.isLiveCredentialsConfigured();

        // 2. Nếu có cấu hình Live GHN, ưu tiên gọi API GHN
        if (liveConnected && request.getToDistrictId() != null) {
            Optional<BigDecimal> ghnFeeOpt = ghnApiClient.calculateFee(request.getToDistrictId(), request.getToWardCode(), weight);
            if (ghnFeeOpt.isPresent()) {
                baseFee = ghnFeeOpt.get();
                calcMethod = "GHN_LIVE_API";
            }
        }

        // 3. Chính sách Miễn phí vận chuyển (Freeship toàn quốc cho đơn từ 500.000 VNĐ)
        boolean isFreeShipping = orderAmount.compareTo(new BigDecimal("500000")) >= 0;
        BigDecimal finalFee = isFreeShipping ? BigDecimal.ZERO : baseFee;
        BigDecimal discount = isFreeShipping ? baseFee : BigDecimal.ZERO;

        String notice = isFreeShipping
                ? "Đơn hàng đạt giá trị từ 500.000 VNĐ - Miễn phí vận chuyển toàn quốc (Tiết kiệm " + baseFee + " VNĐ)"
                : "Phí vận chuyển tính theo " + (calcMethod.equals("GHN_LIVE_API") ? "bảng cước trực tiếp GHN" : "bảng cước tiêu chuẩn Novelia Books");

        return ShippingFeeCalculateResponse.builder()
                .carrierName(shippingProperties.getCarrierName())
                .originalFee(baseFee)
                .shippingFee(finalFee)
                .discountShippingFee(discount)
                .isFreeShipping(isFreeShipping)
                .estimatedDays(estimatedDays)
                .calculationMethod(calcMethod)
                .liveCarrierConnected(liveConnected)
                .notice(notice)
                .build();
    }

    @Override
    @Transactional
    public ShipmentResponse processGhnWebhook(GhnWebhookPayload payload, String webhookToken) {
        // 1. Xác thực webhook token bảo mật
        if (shippingProperties.getWebhookToken() != null && !shippingProperties.getWebhookToken().trim().isEmpty()) {
            if (webhookToken == null || !shippingProperties.getWebhookToken().equals(webhookToken.trim())) {
                log.warn("GHN Webhook: Invalid webhook token received: {}", webhookToken);
                throw new BadRequestException("Token xác thực Webhook GHN không hợp lệ");
            }
        }

        // 2. Tìm kiếm vận đơn theo tracking number hoặc client order code (orderNumber)
        Shipment shipment = null;
        if (payload.getOrderCode() != null && !payload.getOrderCode().trim().isEmpty()) {
            shipment = shipmentRepository.findByTrackingNumber(payload.getOrderCode().trim()).orElse(null);
        }

        if (shipment == null && payload.getClientOrderCode() != null && !payload.getClientOrderCode().trim().isEmpty()) {
            Order order = orderRepository.findByOrderNumber(payload.getClientOrderCode().trim()).orElse(null);
            if (order != null) {
                shipment = shipmentRepository.findByOrderId(order.getId()).stream().findFirst().orElse(null);
            }
        }

        if (shipment == null) {
            log.warn("GHN Webhook: Không tìm thấy vận đơn cho OrderCode: {} hoặc ClientOrderCode: {}", payload.getOrderCode(), payload.getClientOrderCode());
            throw new ResourceNotFoundException("Không tìm thấy thông tin vận đơn khớp với webhook GHN");
        }

        // 3. IDEMPOTENCY CHECK: Nếu vận đơn đã DELIVERED và webhook lại gửi DELIVERED, bỏ qua xử lý lặp
        String ghnStatus = payload.getStatus() != null ? payload.getStatus().trim().toLowerCase() : "";
        if (shipment.getShippingStatus() == Shipment.ShippingStatus.DELIVERED && "delivered".equals(ghnStatus)) {
            log.info("GHN Webhook Idempotency: Shipment #{} already DELIVERED. Skipping duplicate webhook.", shipment.getId());
            return mapToResponse(shipment);
        }

        // 4. Ánh xạ trạng thái GHN sang trạng thái chuẩn Novelia
        Shipment.ShippingStatus newStatus = shipment.getShippingStatus();
        switch (ghnStatus) {
            case "ready_to_pick":
            case "picking":
                newStatus = Shipment.ShippingStatus.PICKED_UP;
                break;
            case "storing":
            case "delivering":
            case "money_collect_delivering":
                newStatus = Shipment.ShippingStatus.IN_TRANSIT;
                break;
            case "delivered":
                newStatus = Shipment.ShippingStatus.DELIVERED;
                shipment.setActualDelivery(LocalDateTime.now());
                break;
            case "cancel":
            case "return":
            case "returned":
                newStatus = Shipment.ShippingStatus.RETURNED;
                break;
            case "delivery_fail":
                newStatus = Shipment.ShippingStatus.FAILED_ATTEMPT;
                break;
            default:
                log.info("GHN Webhook: Unmapped status '{}', keeping current status", ghnStatus);
                break;
        }

        shipment.setShippingStatus(newStatus);
        if (payload.getDescription() != null && !payload.getDescription().trim().isEmpty()) {
            shipment.setNote("GHN Webhook: " + payload.getDescription());
        }

        Shipment saved = shipmentRepository.save(shipment);

        // 5. Đồng bộ trạng thái đơn hàng
        Order order = shipment.getOrder();
        if (newStatus == Shipment.ShippingStatus.DELIVERED) {
            order.setStatus(Order.OrderStatus.DELIVERED);
            orderRepository.save(order);
        } else if (newStatus == Shipment.ShippingStatus.RETURNED) {
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
        }

        auditLogService.log(
                "GHN_WEBHOOK",
                "WEBHOOK_STATUS_SYNC",
                "Shipment",
                String.valueOf(saved.getId()),
                "Đồng bộ trạng thái vận đơn qua GHN Webhook: " + newStatus,
                "GHN Status: " + ghnStatus + ", Mã GHN: " + payload.getOrderCode(),
                "GHN-Webhook-Server",
                "SUCCESS"
        );

        log.info("GHN Webhook synchronized successfully for shipment ID {} -> {}", saved.getId(), newStatus);
        return mapToResponse(saved);
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        boolean liveConnected = shippingProperties.isLiveCredentialsConfigured();
        String notice = liveConnected
                ? "Kết nối trực tiếp tới cổng vận chuyển " + shipment.getShippingCarrier()
                : "Khung tích hợp đơn vị vận chuyển " + shipment.getShippingCarrier() + ". Chưa cấu hình Live API Token nên hệ thống không tạo mã vận đơn giả lập.";

        return ShipmentResponse.builder()
                .id(shipment.getId())
                .orderId(shipment.getOrder().getId())
                .orderNumber(shipment.getOrder().getOrderNumber())
                .receiverName(shipment.getOrder().getReceiverName())
                .shippingAddress(shipment.getOrder().getShippingAddress())
                .trackingNumber(shipment.getTrackingNumber())
                .shippingCarrier(shipment.getShippingCarrier())
                .shippingStatus(shipment.getShippingStatus().name())
                .liveCarrierConnected(liveConnected)
                .integrationNotice(notice)
                .estimatedDelivery(shipment.getEstimatedDelivery())
                .actualDelivery(shipment.getActualDelivery())
                .note(shipment.getNote())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .build();
    }
}
