package com.novelia.coupon.dto;

import com.novelia.coupon.entity.Coupon;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCouponRequest {

    @NotBlank(message = "Mã giảm giá không được để trống")
    @Pattern(regexp = "^[A-Z0-9_-]{3,20}$", message = "Mã giảm giá chỉ gồm 3-20 ký tự chữ hoa, số, dấu gạch nối hoặc gạch dưới")
    private String code;

    @NotNull(message = "Loại giảm giá không được để trống")
    private Coupon.DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0", message = "Giá trị đơn hàng tối thiểu không được âm")
    private BigDecimal minOrderValue;

    @DecimalMin(value = "0.0", message = "Số tiền giảm tối đa không được âm")
    private BigDecimal maxDiscountAmount;

    @Min(value = 1, message = "Giới hạn sử dụng phải từ 1 lượt trở lên")
    private Integer usageLimit;

    @Min(value = 1, message = "Giới hạn sử dụng mỗi người dùng phải từ 1 lượt trở lên")
    @Builder.Default
    private Integer usageLimitPerUser = 1;

    @NotNull(message = "Ngày bắt đầu hiệu lực không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày kết thúc hiệu lực không được để trống")
    private LocalDateTime endDate;

    @Builder.Default
    private Boolean isActive = true;
}
