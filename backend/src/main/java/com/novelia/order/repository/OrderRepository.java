package com.novelia.order.repository;

import com.novelia.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Order> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, Order.OrderStatus status, Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY o.createdAt DESC")
    Page<Order> findOrdersWithFilter(@Param("status") Order.OrderStatus status,
                                     @Param("keyword") String keyword,
                                     Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN com.novelia.payment.entity.Payment p ON p.order = o " +
           "WHERE (:status IS NULL OR o.status = :status) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate) AND " +
           "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
           "(:paymentStatus IS NULL OR p.paymentStatus = :paymentStatus) AND " +
           "(:keyword IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY o.createdAt DESC")
    Page<Order> findOrdersWithAdvancedFilter(
            @Param("status") Order.OrderStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("paymentMethod") com.novelia.payment.entity.Payment.PaymentMethod paymentMethod,
            @Param("paymentStatus") com.novelia.payment.entity.Payment.PaymentStatus paymentStatus,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN :validStatuses")
    BigDecimal calculateTotalRevenue(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status IN :validStatuses AND o.createdAt >= :since")
    BigDecimal calculateRevenueSince(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                     @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.status IN :validStatuses AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    BigDecimal calculateRevenueBetween(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                       @Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    BigDecimal calculateGrossOrderValueBetween(@Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    long countOrdersBetween(@Param("startDate") LocalDateTime startDate,
                            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c.name, COALESCE(SUM(oi.totalPrice), 0) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "JOIN oi.book b " +
           "JOIN b.categories c " +
           "WHERE o.status IN :validStatuses AND o.createdAt >= :since " +
           "GROUP BY c.name " +
           "ORDER BY SUM(oi.totalPrice) DESC")
    List<Object[]> findCategoryRevenueDistributionRaw(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                                      @Param("since") LocalDateTime since);

    @Query("SELECT o FROM Order o WHERE o.status IN :validStatuses AND o.createdAt >= :since ORDER BY o.createdAt ASC")
    List<Order> findValidOrdersSince(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                     @Param("since") LocalDateTime since);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countOrdersByStatusRaw();

    long countByStatus(Order.OrderStatus status);

    @Query("SELECT oi.book.id, oi.bookTitle, oi.bookCover, SUM(oi.quantity), SUM(oi.totalPrice) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status IN :validStatuses " +
           "GROUP BY oi.book.id, oi.bookTitle, oi.bookCover " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingBooksRaw(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                          Pageable pageable);

    List<Order> findTop10ByOrderByCreatedAtDesc();

    long countByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.user.id = :userId AND o.status IN :validStatuses")
    BigDecimal calculateSpentByUserId(@Param("userId") Long userId,
                                      @Param("validStatuses") Collection<Order.OrderStatus> validStatuses);

    @Query("SELECT o.status, COUNT(o), COALESCE(SUM(o.totalAmount), 0) " +
           "FROM Order o " +
           "WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY o.status")
    List<Object[]> countOrdersByStatusBetweenRaw(@Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o " +
           "WHERE o.status IN :validStatuses AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    long countValidOrdersBetween(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                 @Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate);

    @Query("SELECT oi.book.id, oi.bookTitle, oi.bookCover, SUM(oi.quantity), SUM(oi.totalPrice) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "WHERE o.status IN :validStatuses AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY oi.book.id, oi.bookTitle, oi.bookCover " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingBooksByQuantityBetweenRaw(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                                           @Param("startDate") LocalDateTime startDate,
                                                           @Param("endDate") LocalDateTime endDate,
                                                           Pageable pageable);

    @Query("SELECT oi.book.id, oi.bookTitle, oi.bookCover, SUM(oi.quantity), SUM(oi.totalPrice) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "WHERE o.status IN :validStatuses AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY oi.book.id, oi.bookTitle, oi.bookCover " +
           "ORDER BY SUM(oi.totalPrice) DESC")
    List<Object[]> findTopSellingBooksByRevenueBetweenRaw(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                                          @Param("startDate") LocalDateTime startDate,
                                                          @Param("endDate") LocalDateTime endDate,
                                                          Pageable pageable);

    @Query("SELECT c.id, c.name, COUNT(DISTINCT oi.id), SUM(oi.quantity), COALESCE(SUM(oi.totalPrice), 0) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "JOIN oi.book b " +
           "JOIN b.categories c " +
           "WHERE o.status IN :validStatuses AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY c.id, c.name " +
           "ORDER BY SUM(oi.totalPrice) DESC")
    List<Object[]> findCategoryPerformanceBetweenRaw(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT u.id, u.fullName, u.email, u.phone, COUNT(o.id), COALESCE(SUM(o.totalAmount), 0), MAX(o.createdAt) " +
           "FROM Order o " +
           "JOIN o.user u " +
           "WHERE o.status IN :validStatuses AND o.createdAt >= :startDate AND o.createdAt <= :endDate " +
           "GROUP BY u.id, u.fullName, u.email, u.phone " +
           "ORDER BY SUM(o.totalAmount) DESC")
    List<Object[]> findTopCustomersBetweenRaw(@Param("validStatuses") Collection<Order.OrderStatus> validStatuses,
                                              @Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate,
                                              Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate ORDER BY o.createdAt ASC")
    List<Order> findAllOrdersBetween(@Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE UPPER(o.couponCode) = UPPER(:couponCode) AND o.user.id = :userId AND o.status <> :cancelledStatus")
    long countCouponUsagesByUser(@Param("couponCode") String couponCode,
                                 @Param("userId") Long userId,
                                 @Param("cancelledStatus") Order.OrderStatus cancelledStatus);

    @Query("SELECT o FROM Order o JOIN o.items oi WHERE o.user.id = :userId AND oi.book.id = :bookId AND o.status = :status ORDER BY o.createdAt DESC")
    List<Order> findDeliveredOrdersByCustomerAndBook(@Param("userId") Long userId,
                                                    @Param("bookId") Long bookId,
                                                    @Param("status") Order.OrderStatus status);
}
