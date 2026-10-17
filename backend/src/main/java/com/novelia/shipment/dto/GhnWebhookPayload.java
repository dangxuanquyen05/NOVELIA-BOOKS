package com.novelia.shipment.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GhnWebhookPayload {

    @JsonAlias({"OrderCode", "order_code"})
    private String orderCode;

    @JsonAlias({"ClientOrderCode", "client_order_code"})
    private String clientOrderCode;

    @JsonAlias({"Status", "status"})
    private String status;

    @JsonAlias({"Description", "description"})
    private String description;

    @JsonAlias({"TotalFee", "total_fee"})
    private BigDecimal totalFee;

    @JsonAlias({"CODAmount", "cod_amount"})
    private BigDecimal codAmount;

    @JsonAlias({"Weight", "weight"})
    private Integer weight;

    @JsonAlias({"Reason", "reason"})
    private String reason;
}
