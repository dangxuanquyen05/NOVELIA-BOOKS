package com.novelia.inventory.dto;

import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String isbn;
    private String coverImage;
    private TransactionType transactionType;
    private Integer quantityChange;
    private Integer remainingQuantity;
    private String note;
    private String performedBy;
    private LocalDateTime createdAt;
}
