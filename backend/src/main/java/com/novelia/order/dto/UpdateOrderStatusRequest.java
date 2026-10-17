package com.novelia.order.dto;

import com.novelia.order.entity.Order.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotNull(message = "Trạng thái mới không được để trống")
    private OrderStatus newStatus;

    @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
    private String note;
}
