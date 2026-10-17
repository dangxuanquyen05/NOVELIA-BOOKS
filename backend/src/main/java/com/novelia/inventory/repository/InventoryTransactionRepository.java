package com.novelia.inventory.repository;

import com.novelia.inventory.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    Page<InventoryTransaction> findByBookIdOrderByCreatedAtDesc(Long bookId, Pageable pageable);
    List<InventoryTransaction> findByBookIdOrderByCreatedAtDesc(Long bookId);

    @Query("SELECT t FROM InventoryTransaction t WHERE " +
           "(:bookId IS NULL OR t.book.id = :bookId) AND " +
           "(:type IS NULL OR t.transactionType = :type) " +
           "ORDER BY t.createdAt DESC")
    Page<InventoryTransaction> findTransactionsWithFilter(@Param("bookId") Long bookId,
                                                          @Param("type") InventoryTransaction.TransactionType type,
                                                          Pageable pageable);
}
