package com.novelia.order.dto;

import com.novelia.payment.entity.Payment.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePaymentStatusRequest {
    @NotNull(message = "Trạng thái thanh toán không được để trống")
    private PaymentStatus newStatus;

    private String transactionCode;

    private String note;
}
