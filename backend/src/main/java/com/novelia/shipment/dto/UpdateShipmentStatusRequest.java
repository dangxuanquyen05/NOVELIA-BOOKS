package com.novelia.shipment.dto;

import com.novelia.shipment.entity.Shipment;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShipmentStatusRequest {

    @NotNull(message = "Trạng thái vận chuyển không được để trống")
    private Shipment.ShippingStatus shippingStatus;

    private String note;
    private LocalDateTime actualDelivery;
}
