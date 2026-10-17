package com.novelia.shipment.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.shipment.dto.CreateShipmentRequest;
import com.novelia.shipment.dto.ShipmentResponse;
import com.novelia.shipment.dto.UpdateShipmentStatusRequest;
import com.novelia.shipment.service.ShippingCarrierService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/shipments")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminShipmentController {

    private final ShippingCarrierService shippingCarrierService;

    public AdminShipmentController(ShippingCarrierService shippingCarrierService) {
        this.shippingCarrierService = shippingCarrierService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ShipmentResponse>>> getAllShipments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ShipmentResponse> shipmentPage = shippingCarrierService.getAllShipments(pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vận đơn thành công", PageResponse.from(shipmentPage)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShipmentResponse>> createShipment(
            @Valid @RequestBody CreateShipmentRequest request) {
        ShipmentResponse created = shippingCarrierService.createShipment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo tiến trình vận chuyển thành công", created));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ShipmentResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShipmentStatusRequest request) {
        ShipmentResponse updated = shippingCarrierService.updateShipmentStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái vận đơn thành công", updated));
    }
}
