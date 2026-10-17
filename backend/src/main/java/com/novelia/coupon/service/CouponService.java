package com.novelia.coupon.service;

import com.novelia.coupon.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
    CouponValidationResponse validateCoupon(String code, BigDecimal orderAmount);
    CouponValidationResponse validateCoupon(String code, BigDecimal orderAmount, String userEmail);
    BigDecimal calculateAndApplyCoupon(String code, BigDecimal orderAmount);
    BigDecimal calculateAndApplyCoupon(String code, BigDecimal orderAmount, String userEmail);
    void releaseCoupon(String code);
    List<CouponResponse> getAvailableCoupons();
    Page<CouponResponse> getAllCoupons(String keyword, Pageable pageable);
    CouponResponse getCouponById(Long id);
    CouponResponse createCoupon(CreateCouponRequest request);
    CouponResponse updateCoupon(Long id, UpdateCouponRequest request);
    void toggleCouponStatus(Long id);
    void terminateCoupon(Long id);
    void deleteCoupon(Long id);
}
