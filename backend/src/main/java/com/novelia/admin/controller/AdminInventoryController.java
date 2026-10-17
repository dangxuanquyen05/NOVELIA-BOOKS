package com.novelia.admin.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.inventory.dto.*;
import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import com.novelia.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inventory")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_STAFF')")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    public AdminInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<InventoryResponse>>> getInventories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InventoryResponse> response = inventoryService.getInventories(keyword, status, lowStockOnly, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<InventorySummaryResponse>> getInventorySummary() {
        InventorySummaryResponse summary = inventoryService.getInventorySummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/low-stock-count")
    public ResponseEntity<ApiResponse<Long>> getLowStockCount() {
        long count = inventoryService.getLowStockCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<PageResponse<InventoryTransactionResponse>>> getTransactions(
            @RequestParam(required = false) Long bookId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InventoryTransactionResponse> response = inventoryService.getTransactions(bookId, type, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustInventory(
            Authentication authentication,
            @Valid @RequestBody InventoryAdjustRequest request) {
        InventoryResponse response = inventoryService.adjustInventory(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh tồn kho thành công", response));
    }

    @PutMapping("/{bookId}/threshold")
    public ResponseEntity<ApiResponse<InventoryResponse>> updateThreshold(
            Authentication authentication,
            @PathVariable Long bookId,
            @Valid @RequestBody InventoryThresholdRequest request) {
        InventoryResponse response = inventoryService.updateThreshold(bookId, request.getLowStockThreshold(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ngưỡng cảnh báo tồn kho thành công", response));
    }

    @PostMapping("/import-receipt")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> createGoodsReceipt(
            Authentication authentication,
            @Valid @RequestBody GoodsReceiptRequest request) {
        GoodsReceiptResponse response = inventoryService.createGoodsReceipt(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Tạo phiếu nhập hàng thành công", response));
    }
}
