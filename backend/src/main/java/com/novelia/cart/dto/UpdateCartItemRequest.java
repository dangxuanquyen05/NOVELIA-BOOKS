package com.novelia.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCartItemRequest {

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng trong giỏ hàng tối thiểu là 1 cuốn")
    @Max(value = 999, message = "Số lượng trong giỏ hàng tối đa là 999 cuốn")
    private Integer quantity;
}
