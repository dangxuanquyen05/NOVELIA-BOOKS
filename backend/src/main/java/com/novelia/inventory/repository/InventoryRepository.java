package com.novelia.inventory.repository;

import com.novelia.inventory.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByBookId(Long bookId);

    List<Inventory> findByBookIdIn(java.util.Collection<Long> bookIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.book.id = :bookId")
    Optional<Inventory> findByBookIdForUpdate(@Param("bookId") Long bookId);

    @Query("SELECT i FROM Inventory i WHERE " +
           "(:keyword IS NULL OR LOWER(i.book.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(i.book.isbn) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:lowStockOnly = false OR (i.quantity - i.reservedQuantity) <= i.lowStockThreshold) " +
           "ORDER BY i.quantity ASC")
    Page<Inventory> findInventoriesWithFilter(@Param("keyword") String keyword,
                                             @Param("lowStockOnly") boolean lowStockOnly,
                                             Pageable pageable);

    @Query("SELECT i FROM Inventory i WHERE " +
           "(:keyword IS NULL OR LOWER(i.book.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(i.book.isbn) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR :status = 'ALL' " +
           " OR (:status = 'LOW_STOCK' AND (i.quantity - i.reservedQuantity) <= i.lowStockThreshold AND (i.quantity - i.reservedQuantity) > 0) " +
           " OR (:status = 'OUT_OF_STOCK' AND (i.quantity - i.reservedQuantity) <= 0) " +
           " OR (:status = 'IN_STOCK' AND (i.quantity - i.reservedQuantity) > i.lowStockThreshold)) AND " +
           "(:lowStockOnly = false OR (i.quantity - i.reservedQuantity) <= i.lowStockThreshold) " +
           "ORDER BY i.quantity ASC")
    Page<Inventory> findInventoriesWithAdvancedFilter(@Param("keyword") String keyword,
                                                     @Param("status") String status,
                                                     @Param("lowStockOnly") boolean lowStockOnly,
                                                     Pageable pageable);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE (i.quantity - i.reservedQuantity) <= i.lowStockThreshold")
    long countLowStockItems();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE (i.quantity - i.reservedQuantity) <= 0")
    long countOutOfStockItems();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE (i.quantity - i.reservedQuantity) > i.lowStockThreshold")
    long countInStockItems();

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Inventory i")
    long sumTotalPhysicalStock();

    @Query("SELECT i FROM Inventory i WHERE (i.quantity - i.reservedQuantity) <= i.lowStockThreshold ORDER BY (i.quantity - i.reservedQuantity) ASC")
    List<Inventory> findTopLowStockItems(Pageable pageable);
}
