package com.novelia.shipment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingFeeCalculateResponse {

    private String carrierName;
    private BigDecimal shippingFee;
    private BigDecimal originalFee;
    private BigDecimal discountShippingFee;
    private boolean isFreeShipping;
    private int estimatedDays;
    private String calculationMethod; // "GHN_LIVE_API" or "NOVELIA_STANDARD_POLICY"
    private boolean liveCarrierConnected;
    private String notice;
}
