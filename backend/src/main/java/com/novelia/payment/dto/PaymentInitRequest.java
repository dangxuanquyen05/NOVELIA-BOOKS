package com.novelia.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitRequest {

    @NotBlank(message = "Mã đơn hàng không được để trống")
    private String orderNumber;

    @Builder.Default
    private String paymentMethod = "VNPAY";

    private String bankCode;
}
