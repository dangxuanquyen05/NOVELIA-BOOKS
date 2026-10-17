package com.novelia.coupon.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class ValidateCouponRequest {

    @NotBlank(message = "Mã giảm giá không được để trống")
    private String code;

    @NotNull(message = "Giá trị đơn hàng không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị đơn hàng phải lớn hơn 0")
    private BigDecimal orderAmount;
}
