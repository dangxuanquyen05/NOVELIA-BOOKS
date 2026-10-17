package com.novelia.shipment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingFeeCalculateRequest {

    private String toProvince;
    private String toDistrict;
    private String toWard;

    private Integer toDistrictId;
    private String toWardCode;

    @Builder.Default
    private Integer weightGrams = 500; // Khối lượng sách ước tính, mặc định 500g

    @NotNull(message = "Giá trị đơn hàng không được để trống")
    private BigDecimal orderAmount;
}
