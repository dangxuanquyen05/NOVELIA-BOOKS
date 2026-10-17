package com.novelia.shipment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShipmentRequest {

    @NotNull(message = "ID đơn hàng không được để trống")
    private Long orderId;

    @Builder.Default
    private String carrierName = "GiaoHangNhanh";

    private String note;
}
