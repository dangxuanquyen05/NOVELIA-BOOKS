package com.novelia.inventory.service;

import com.novelia.common.dto.PageResponse;
import com.novelia.inventory.dto.*;
import com.novelia.inventory.entity.InventoryTransaction.TransactionType;

public interface InventoryService {

    default PageResponse<InventoryResponse> getInventories(String keyword, boolean lowStockOnly, int page, int size) {
        return getInventories(keyword, null, lowStockOnly, page, size);
    }

    PageResponse<InventoryResponse> getInventories(String keyword, String status, boolean lowStockOnly, int page, int size);

    InventorySummaryResponse getInventorySummary();

    long getLowStockCount();

    PageResponse<InventoryTransactionResponse> getTransactions(Long bookId, TransactionType type, int page, int size);

    InventoryResponse adjustInventory(InventoryAdjustRequest request, String operatorEmail);

    InventoryResponse updateThreshold(Long bookId, int lowStockThreshold, String operatorEmail);

    GoodsReceiptResponse createGoodsReceipt(GoodsReceiptRequest request, String operatorEmail);
}
