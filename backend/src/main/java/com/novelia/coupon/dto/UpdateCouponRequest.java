package com.novelia.coupon.dto;

import com.novelia.coupon.entity.Coupon;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class UpdateCouponRequest {

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
    private Integer usageLimitPerUser;

    @NotNull(message = "Ngày bắt đầu hiệu lực không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày kết thúc hiệu lực không được để trống")
    private LocalDateTime endDate;

    private Boolean isActive;
}
