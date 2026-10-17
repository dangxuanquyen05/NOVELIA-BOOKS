package com.novelia.shipment.service;

import com.novelia.shipment.dto.CreateShipmentRequest;
import com.novelia.shipment.dto.ShipmentResponse;
import com.novelia.shipment.dto.UpdateShipmentStatusRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ShippingCarrierService {
    ShipmentResponse createShipment(CreateShipmentRequest request);
    ShipmentResponse getShipmentByOrderId(Long orderId);
    ShipmentResponse trackShipment(String trackingNumber);
    ShipmentResponse updateShipmentStatus(Long shipmentId, UpdateShipmentStatusRequest request);
    Page<ShipmentResponse> getAllShipments(Pageable pageable);
    com.novelia.shipment.dto.ShippingFeeCalculateResponse calculateShippingFee(com.novelia.shipment.dto.ShippingFeeCalculateRequest request);
    ShipmentResponse processGhnWebhook(com.novelia.shipment.dto.GhnWebhookPayload payload, String webhookToken);
}
