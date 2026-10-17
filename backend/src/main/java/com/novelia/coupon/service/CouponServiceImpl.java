package com.novelia.coupon.service;

import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.coupon.dto.*;
import com.novelia.coupon.entity.Coupon;
import com.novelia.coupon.repository.CouponRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.user.entity.User;
import com.novelia.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final com.novelia.audit.service.AuditLogService auditLogService;

    public CouponServiceImpl(
            CouponRepository couponRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            com.novelia.audit.service.AuditLogService auditLogService) {
        this.couponRepository = couponRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, BigDecimal orderAmount) {
        return validateCoupon(code, orderAmount, null);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, BigDecimal orderAmount, String userEmail) {
        if (code == null || code.trim().isEmpty()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Mã giảm giá không được để trống")
                    .originalAmount(orderAmount)
                    .finalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        String cleanCode = code.trim().toUpperCase(Locale.ROOT);
        Coupon coupon = couponRepository.findByCodeIgnoreCase(cleanCode).orElse(null);

        if (coupon == null) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã giảm giá '" + cleanCode + "' không tồn tại trong hệ thống")
                    .originalAmount(orderAmount)
                    .finalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã giảm giá đã tạm thời ngưng kích hoạt")
                    .originalAmount(orderAmount)
                    .finalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Chương trình ưu đãi chưa bắt đầu")
                    .originalAmount(orderAmount)
                    .finalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã giảm giá đã hết hạn sử dụng")
                    .originalAmount(orderAmount)
                    .finalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã giảm giá đã đạt số lượt sử dụng tối đa của chương trình")
                    .originalAmount(orderAmount)
                    .finalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        if (userEmail != null && !userEmail.trim().isEmpty() && coupon.getUsageLimitPerUser() != null) {
            User user = userRepository.findByEmail(userEmail.trim()).orElse(null);
            if (user != null) {
                long userUsageCount = orderRepository.countCouponUsagesByUser(cleanCode, user.getId(), Order.OrderStatus.CANCELLED);
                if (userUsageCount >= coupon.getUsageLimitPerUser()) {
                    return CouponValidationResponse.builder()
                            .valid(false)
                            .code(cleanCode)
                            .message("Bạn đã sử dụng hết số lượt cho phép (" + coupon.getUsageLimitPerUser() + " lần) của mã ưu đãi này")
                            .originalAmount(orderAmount)
                            .finalAmount(orderAmount)
                            .discountAmount(BigDecimal.ZERO)
                            .build();
                }
            }
        }

        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Giá trị đơn hàng không hợp lệ")
                    .originalAmount(BigDecimal.ZERO)
                    .finalAmount(BigDecimal.ZERO)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        if (coupon.getMinOrderValue() != null && orderAmount.compareTo(coupon.getMinOrderValue()) < 0) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .minOrderValue(coupon.getMinOrderValue())
                    .message("Đơn hàng chưa đạt giá trị tối thiểu " + formatMoney(coupon.getMinOrderValue()) + "đ để áp dụng mã này")
                    .originalAmount(orderAmount)
                    .finalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        BigDecimal discountAmount;
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            BigDecimal percent = coupon.getDiscountValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            discountAmount = orderAmount.multiply(percent).setScale(0, RoundingMode.HALF_UP);

            if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discountAmount = coupon.getMaxDiscountAmount();
            }
        } else {
            discountAmount = coupon.getDiscountValue();
            if (discountAmount.compareTo(orderAmount) > 0) {
                discountAmount = orderAmount;
            }
        }

        BigDecimal finalAmount = orderAmount.subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        return CouponValidationResponse.builder()
                .valid(true)
                .code(cleanCode)
                .discountType(coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .discountAmount(discountAmount)
                .minOrderValue(coupon.getMinOrderValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .originalAmount(orderAmount)
                .finalAmount(finalAmount)
                .message("Áp dụng mã giảm giá thành công! Tiết kiệm " + formatMoney(discountAmount) + "đ")
                .build();
    }

    @Override
    @Transactional
    public BigDecimal calculateAndApplyCoupon(String code, BigDecimal orderAmount) {
        return calculateAndApplyCoupon(code, orderAmount, null);
    }

    @Override
    @Transactional
    public BigDecimal calculateAndApplyCoupon(String code, BigDecimal orderAmount, String userEmail) {
        if (code == null || code.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        String cleanCode = code.trim().toUpperCase(Locale.ROOT);
        // Pessimistic write lock for strict concurrency control
        Coupon coupon = couponRepository.findByCodeWithLock(cleanCode)
                .orElseThrow(() -> new BadRequestException("Mã giảm giá '" + cleanCode + "' không tồn tại"));

        CouponValidationResponse val = validateCoupon(cleanCode, orderAmount, userEmail);
        if (!val.isValid()) {
            throw new BadRequestException(val.getMessage());
        }

        // Increment used count safely under lock
        coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
        couponRepository.save(coupon);

        log.info("Coupon {} applied successfully for user {}. Discount: {}. Used count: {}/{}",
                cleanCode, userEmail, val.getDiscountAmount(), coupon.getUsedCount(), coupon.getUsageLimit());

        return val.getDiscountAmount();
    }

    @Override
    @Transactional
    public void releaseCoupon(String code) {
        if (code == null || code.trim().isEmpty()) {
            return;
        }
        String cleanCode = code.trim().toUpperCase(Locale.ROOT);
        couponRepository.findByCodeIgnoreCase(cleanCode).ifPresent(coupon -> {
            if (coupon.getUsedCount() != null && coupon.getUsedCount() > 0) {
                coupon.setUsedCount(coupon.getUsedCount() - 1);
                couponRepository.save(coupon);
                log.info("Coupon {} released after order cancellation. New used count: {}", cleanCode, coupon.getUsedCount());
            }
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getAvailableCoupons() {
        return couponRepository.findAvailableCoupons(LocalDateTime.now())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> getAllCoupons(String keyword, Pageable pageable) {
        String query = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return couponRepository.searchCoupons(query, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá với ID: " + id));
        return mapToResponse(coupon);
    }

    @Override
    @Transactional
    public CouponResponse createCoupon(CreateCouponRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (couponRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new BadRequestException("Mã giảm giá '" + cleanCode + "' đã tồn tại trong hệ thống");
        }

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc hiệu lực");
        }

        if (request.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Giảm giá theo phần trăm không được vượt quá 100%");
            }
        }

        Coupon coupon = Coupon.builder()
                .code(cleanCode)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit())
                .usageLimitPerUser(request.getUsageLimitPerUser() != null ? request.getUsageLimitPerUser() : 1)
                .usedCount(0)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Coupon saved = couponRepository.save(coupon);
        log.info("Created coupon {} successfully", cleanCode);

        auditLogService.log(getCurrentUserEmail(), "COUPON_CREATE", "COUPON", cleanCode,
                "Tạo mã giảm giá: " + cleanCode,
                "Loại: " + coupon.getDiscountType() + ", Giá trị: " + coupon.getDiscountValue() + ", Lượt: " + coupon.getUsageLimit() + ", Hạn đến: " + coupon.getEndDate());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(Long id, UpdateCouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá với ID: " + id));

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc hiệu lực");
        }

        if (request.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Giảm giá theo phần trăm không được vượt quá 100%");
            }
        }

        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO);
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setUsageLimit(request.getUsageLimit());
        if (request.getUsageLimitPerUser() != null) {
            coupon.setUsageLimitPerUser(request.getUsageLimitPerUser());
        }
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        if (request.getIsActive() != null) {
            coupon.setIsActive(request.getIsActive());
        }

        Coupon saved = couponRepository.save(coupon);
        log.info("Updated coupon ID {} ({}) successfully", id, coupon.getCode());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void toggleCouponStatus(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá với ID: " + id));
        coupon.setIsActive(!Boolean.TRUE.equals(coupon.getIsActive()));
        couponRepository.save(coupon);
        log.info("Toggled coupon ID {} isActive to {}", id, coupon.getIsActive());
    }

    @Override
    @Transactional
    public void terminateCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá với ID: " + id));
        coupon.setIsActive(false);
        coupon.setEndDate(LocalDateTime.now());
        couponRepository.save(coupon);
        log.info("Terminated coupon ID {} ({}) successfully. Active set to false, endDate set to now.", id, coupon.getCode());

        auditLogService.log(getCurrentUserEmail(), "COUPON_TERMINATE", "COUPON", coupon.getCode(),
                "Kết thúc đợt khuyến mãi của mã: " + coupon.getCode(),
                "Đã set isActive = false, endDate = now");
    }

    @Override
    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá với ID: " + id));
        if (coupon.getUsedCount() != null && coupon.getUsedCount() > 0) {
            // If already used in orders, soft disable instead of hard delete to preserve historical integrity
            coupon.setIsActive(false);
            couponRepository.save(coupon);
            auditLogService.log(getCurrentUserEmail(), "COUPON_DELETE", "COUPON", coupon.getCode(),
                    "Vô hiệu hóa mã giảm giá: " + coupon.getCode(),
                    "Chuyển sang isActive = false do đã phát sinh lượt sử dụng");
            log.info("Coupon ID {} has been used in orders. Soft disabled instead of hard delete.", id);
            return;
        }
        couponRepository.delete(coupon);
        auditLogService.log(getCurrentUserEmail(), "COUPON_DELETE", "COUPON", coupon.getCode(),
                "Xóa vĩnh viễn mã giảm giá: " + coupon.getCode(),
                "Đã xóa hoàn toàn khỏi cơ sở dữ liệu");
        log.info("Deleted coupon ID {} successfully", id);
    }

    private String getCurrentUserEmail() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) ? auth.getName() : "SYSTEM";
    }

    private CouponResponse mapToResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .minOrderValue(coupon.getMinOrderValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .usageLimit(coupon.getUsageLimit())
                .usageLimitPerUser(coupon.getUsageLimitPerUser())
                .usedCount(coupon.getUsedCount())
                .startDate(coupon.getStartDate())
                .endDate(coupon.getEndDate())
                .isActive(coupon.getIsActive())
                .build();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format(Locale.GERMAN, "%,.0f", amount);
    }
}
