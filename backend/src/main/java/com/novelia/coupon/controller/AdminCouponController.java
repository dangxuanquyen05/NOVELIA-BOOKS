package com.novelia.coupon.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.coupon.dto.CouponResponse;
import com.novelia.coupon.dto.CreateCouponRequest;
import com.novelia.coupon.dto.UpdateCouponRequest;
import com.novelia.coupon.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CouponResponse>>> getAllCoupons(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CouponResponse> couponPage = couponService.getAllCoupons(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách mã giảm giá thành công", PageResponse.from(couponPage)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponById(@PathVariable Long id) {
        CouponResponse coupon = couponService.getCouponById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin mã giảm giá thành công", coupon));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @Valid @RequestBody CreateCouponRequest request) {
        CouponResponse created = couponService.createCoupon(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mã giảm giá thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCouponRequest request) {
        CouponResponse updated = couponService.updateCoupon(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mã giảm giá thành công", updated));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleCouponStatus(@PathVariable Long id) {
        couponService.toggleCouponStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Thay đổi trạng thái mã giảm giá thành công", null));
    }

    @PatchMapping("/{id}/terminate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> terminateCoupon(@PathVariable Long id) {
        couponService.terminateCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Kết thúc đợt khuyến mãi của mã giảm giá thành công", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mã giảm giá thành công", null));
    }
}
