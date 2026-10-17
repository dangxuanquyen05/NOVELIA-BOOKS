package com.novelia.order.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    // Option 1: Dùng ID địa chỉ đã lưu
    private Long addressId;

    // Option 2: Nhập trực tiếp địa chỉ mới
    @Size(max = 100, message = "Tên người nhận không được vượt quá 100 ký tự")
    private String receiverName;

    @Size(max = 20, message = "Số điện thoại không hợp lệ")
    private String receiverPhone;

    @Size(max = 100)
    private String province;

    @Size(max = 100)
    private String district;

    @Size(max = 100)
    private String ward;

    @Size(max = 255)
    private String detailedAddress;

    // Chuỗi địa chỉ hoàn chỉnh nếu gửi trực tiếp
    @Size(max = 255)
    private String shippingAddress;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;

    @Builder.Default
    private String paymentMethod = "COD";

    // Mã ưu đãi giảm giá (Coupon Code)
    @Size(max = 50, message = "Mã giảm giá không hợp lệ")
    private String couponCode;

    // Khóa chống lặp (Idempotency Key)
    private String idempotencyKey;
}
