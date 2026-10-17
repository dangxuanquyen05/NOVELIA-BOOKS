package com.novelia.coupon.repository;

import com.novelia.coupon.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
    Optional<Coupon> findByCode(String code);
    boolean existsByCodeIgnoreCase(String code);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE UPPER(c.code) = UPPER(:code)")
    Optional<Coupon> findByCodeWithLock(@Param("code") String code);

    @Query("SELECT c FROM Coupon c WHERE c.isActive = true AND c.startDate <= :now AND c.endDate >= :now AND (c.usageLimit IS NULL OR c.usedCount < c.usageLimit) ORDER BY c.createdAt DESC")
    List<Coupon> findAvailableCoupons(@Param("now") LocalDateTime now);

    @Query("SELECT c FROM Coupon c WHERE :keyword IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY c.createdAt DESC")
    Page<Coupon> searchCoupons(@Param("keyword") String keyword, Pageable pageable);
}
