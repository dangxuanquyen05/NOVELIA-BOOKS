package com.novelia.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptResponse {
    private String receiptCode;
    private String supplierName;
    private Integer totalItems;
    private Integer totalQuantity;
    private String note;
    private String performedBy;
    private LocalDateTime createdAt;
    private List<InventoryResponse> updatedInventories;
}
