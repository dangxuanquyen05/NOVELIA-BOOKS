package com.novelia.coupon.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.coupon.dto.CouponResponse;
import com.novelia.coupon.dto.CouponValidationResponse;
import com.novelia.coupon.dto.ValidateCouponRequest;
import com.novelia.coupon.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request,
            Authentication authentication) {
        String userEmail = (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName()))
                ? authentication.getName()
                : null;
        CouponValidationResponse result = couponService.validateCoupon(request.getCode(), request.getOrderAmount(), userEmail);
        return ResponseEntity.ok(ApiResponse.success(result.isValid() ? "Áp dụng mã giảm giá thành công" : result.getMessage(), result));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getAvailableCoupons() {
        List<CouponResponse> coupons = couponService.getAvailableCoupons();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách mã ưu đãi thành công", coupons));
    }
}
