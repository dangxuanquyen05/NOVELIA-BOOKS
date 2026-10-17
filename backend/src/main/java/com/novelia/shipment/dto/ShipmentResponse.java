package com.novelia.shipment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private String receiverName;
    private String shippingAddress;
    private String trackingNumber;
    private String shippingCarrier;
    private String shippingStatus;
    private boolean liveCarrierConnected;
    private String integrationNotice;
    private LocalDateTime estimatedDelivery;
    private LocalDateTime actualDelivery;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
