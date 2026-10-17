package com.novelia.inventory.service;

import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.common.dto.PageResponse;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.inventory.dto.*;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.entity.InventoryTransaction;
import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.inventory.repository.InventoryTransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final BookRepository bookRepository;
    private final com.novelia.audit.service.AuditLogService auditLogService;

    public InventoryServiceImpl(
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            BookRepository bookRepository,
            com.novelia.audit.service.AuditLogService auditLogService) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.bookRepository = bookRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryResponse> getInventories(String keyword, String status, boolean lowStockOnly, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String filterStatus = (status != null && !status.isBlank()) ? status.trim().toUpperCase(Locale.ROOT) : null;

        Page<Inventory> inventoryPage = inventoryRepository.findInventoriesWithAdvancedFilter(kw, filterStatus, lowStockOnly, pageable);

        List<InventoryResponse> responses = inventoryPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<InventoryResponse>builder()
                .content(responses)
                .pageNumber(inventoryPage.getNumber())
                .pageSize(inventoryPage.getSize())
                .totalElements(inventoryPage.getTotalElements())
                .totalPages(inventoryPage.getTotalPages())
                .isFirst(inventoryPage.isFirst())
                .isLast(inventoryPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummary() {
        long totalBooks = inventoryRepository.count();
        long inStockCount = inventoryRepository.countInStockItems();
        long lowStockCount = inventoryRepository.countLowStockItems();
        long outOfStockCount = inventoryRepository.countOutOfStockItems();
        long totalPhysicalStock = inventoryRepository.sumTotalPhysicalStock();

        return InventorySummaryResponse.builder()
                .totalBooks(totalBooks)
                .inStockCount(inStockCount)
                .lowStockCount(lowStockCount)
                .outOfStockCount(outOfStockCount)
                .totalPhysicalStock(totalPhysicalStock)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getLowStockCount() {
        return inventoryRepository.countLowStockItems();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryTransactionResponse> getTransactions(Long bookId, TransactionType type, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<InventoryTransaction> txPage = inventoryTransactionRepository.findTransactionsWithFilter(bookId, type, pageable);

        List<InventoryTransactionResponse> responses = txPage.getContent().stream()
                .map(tx -> InventoryTransactionResponse.builder()
                        .id(tx.getId())
                        .bookId(tx.getBook() != null ? tx.getBook().getId() : null)
                        .bookTitle(tx.getBook() != null ? tx.getBook().getTitle() : null)
                        .isbn(tx.getBook() != null ? tx.getBook().getIsbn() : null)
                        .coverImage(tx.getBook() != null ? tx.getBook().getCoverImage() : null)
                        .transactionType(tx.getTransactionType())
                        .quantityChange(tx.getQuantityChange())
                        .remainingQuantity(tx.getRemainingQuantity())
                        .note(tx.getNote())
                        .performedBy(tx.getPerformedBy())
                        .createdAt(tx.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.<InventoryTransactionResponse>builder()
                .content(responses)
                .pageNumber(txPage.getNumber())
                .pageSize(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .totalPages(txPage.getTotalPages())
                .isFirst(txPage.isFirst())
                .isLast(txPage.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InventoryResponse adjustInventory(InventoryAdjustRequest request, String operatorEmail) {
        if (request.getQuantityChange() == null || request.getQuantityChange() == 0) {
            throw new BadRequestException("Số lượng thay đổi phải khác 0");
        }

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác phẩm với ID: " + request.getBookId()));

        // Pessimistic lock row for concurrency safety
        Inventory inv = inventoryRepository.findByBookIdForUpdate(book.getId())
                .orElseGet(() -> Inventory.builder()
                        .book(book)
                        .quantity(0)
                        .reservedQuantity(0)
                        .lowStockThreshold(5)
                        .build());

        int currentQuantity = inv.getQuantity() != null ? inv.getQuantity() : 0;
        int newQuantity = currentQuantity + request.getQuantityChange();

        if (newQuantity < 0) {
            throw new BadRequestException("Số lượng tồn kho sau điều chỉnh không thể nhỏ hơn 0 (Hiện tại: "
                    + currentQuantity + ", Thay đổi: " + request.getQuantityChange() + ")");
        }

        int reserved = inv.getReservedQuantity() != null ? inv.getReservedQuantity() : 0;
        if (newQuantity < reserved) {
            throw new BadRequestException("Số lượng tồn mới (" + newQuantity + ") không thể nhỏ hơn số lượng đang giữ cho đơn hàng (" + reserved + ")");
        }

        inv.setQuantity(newQuantity);
        Inventory savedInv = inventoryRepository.save(inv);

        String note = (request.getNote() != null && !request.getNote().isBlank()) ? request.getNote().trim() : "Điều chỉnh kho";
        InventoryTransaction tx = InventoryTransaction.builder()
                .book(book)
                .transactionType(request.getTransactionType())
                .quantityChange(request.getQuantityChange())
                .remainingQuantity(newQuantity)
                .performedBy(operatorEmail)
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();
        inventoryTransactionRepository.save(tx);

        log.info("Inventory adjusted for book '{}' (ID: {}). Change: {}, New Quantity: {} by {}",
                book.getTitle(), book.getId(), request.getQuantityChange(), newQuantity, operatorEmail);

        auditLogService.log(operatorEmail, "INVENTORY_ADJUST", "INVENTORY", book.getId().toString(),
                "Điều chỉnh tồn kho sách: " + book.getTitle() + " (" + (request.getQuantityChange() >= 0 ? "+" : "") + request.getQuantityChange() + ")",
                "Lý do: " + note + ", Tồn mới: " + newQuantity);

        return mapToResponse(savedInv);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InventoryResponse updateThreshold(Long bookId, int lowStockThreshold, String operatorEmail) {
        if (lowStockThreshold < 0) {
            throw new BadRequestException("Ngưỡng cảnh báo tồn kho tối thiểu là 0");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác phẩm với ID: " + bookId));

        Inventory inv = inventoryRepository.findByBookIdForUpdate(bookId)
                .orElseGet(() -> Inventory.builder()
                        .book(book)
                        .quantity(0)
                        .reservedQuantity(0)
                        .lowStockThreshold(lowStockThreshold)
                        .build());

        inv.setLowStockThreshold(lowStockThreshold);
        Inventory savedInv = inventoryRepository.save(inv);

        log.info("Low stock threshold updated to {} for book '{}' (ID: {}) by {}",
                lowStockThreshold, book.getTitle(), bookId, operatorEmail);

        auditLogService.log(operatorEmail, "INVENTORY_THRESHOLD", "INVENTORY", bookId.toString(),
                "Cập nhật ngưỡng cảnh báo tồn thấp: " + book.getTitle() + " -> " + lowStockThreshold,
                "Ngưỡng mới: " + lowStockThreshold);

        return mapToResponse(savedInv);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public GoodsReceiptResponse createGoodsReceipt(GoodsReceiptRequest request, String operatorEmail) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Danh sách mặt hàng nhập không được để trống");
        }

        String receiptCode = request.getReceiptCode();
        if (receiptCode == null || receiptCode.isBlank()) {
            receiptCode = "PN-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-"
                    + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        } else {
            receiptCode = receiptCode.trim().toUpperCase(Locale.ROOT);
        }

        String supplier = (request.getSupplierName() != null && !request.getSupplierName().isBlank())
                ? request.getSupplierName().trim() : "Nhà cung cấp đối tác";
        String note = (request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim() : "";

        List<InventoryResponse> updatedInventories = new ArrayList<>();
        int totalQuantity = 0;

        for (GoodsReceiptRequest.ReceiptItem item : request.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new BadRequestException("Số lượng nhập cho sách ID " + item.getBookId() + " phải lớn hơn 0");
            }

            Book book = bookRepository.findById(item.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác phẩm với ID: " + item.getBookId()));

            // Concurrency lock row
            Inventory inv = inventoryRepository.findByBookIdForUpdate(book.getId())
                    .orElseGet(() -> Inventory.builder()
                            .book(book)
                            .quantity(0)
                            .reservedQuantity(0)
                            .lowStockThreshold(5)
                            .build());

            int currentQty = inv.getQuantity() != null ? inv.getQuantity() : 0;
            int newQty = currentQty + item.getQuantity();
            inv.setQuantity(newQty);
            Inventory savedInv = inventoryRepository.save(inv);
            updatedInventories.add(mapToResponse(savedInv));

            totalQuantity += item.getQuantity();

            String txNote = String.format("Phiếu nhập #%s (%s)%s",
                    receiptCode, supplier, (!note.isEmpty() ? " - " + note : ""));

            InventoryTransaction tx = InventoryTransaction.builder()
                    .book(book)
                    .transactionType(TransactionType.IMPORT)
                    .quantityChange(item.getQuantity())
                    .remainingQuantity(newQty)
                    .performedBy(operatorEmail)
                    .note(txNote)
                    .createdAt(LocalDateTime.now())
                    .build();
            inventoryTransactionRepository.save(tx);
        }

        log.info("Goods receipt #{} created with {} items, total quantity: {} by {}",
                receiptCode, request.getItems().size(), totalQuantity, operatorEmail);

        auditLogService.log(operatorEmail, "INVENTORY_RECEIPT", "INVENTORY", receiptCode,
                "Nhập kho theo phiếu " + receiptCode + " (" + totalQuantity + " cuốn)",
                "Nhà cung cấp: " + supplier + ", Số tựa sách: " + request.getItems().size());

        return GoodsReceiptResponse.builder()
                .receiptCode(receiptCode)
                .supplierName(supplier)
                .totalItems(request.getItems().size())
                .totalQuantity(totalQuantity)
                .note(note)
                .performedBy(operatorEmail)
                .createdAt(LocalDateTime.now())
                .updatedInventories(updatedInventories)
                .build();
    }

    private InventoryResponse mapToResponse(Inventory inv) {
        Book b = inv.getBook();
        int available = inv.getAvailableQuantity();
        int threshold = inv.getLowStockThreshold() != null ? inv.getLowStockThreshold() : 5;
        boolean isLow = available <= threshold;

        return InventoryResponse.builder()
                .id(inv.getId())
                .bookId(b != null ? b.getId() : null)
                .bookTitle(b != null ? b.getTitle() : null)
                .isbn(b != null ? b.getIsbn() : null)
                .coverImage(b != null ? b.getCoverImage() : null)
                .quantity(inv.getQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .availableQuantity(available)
                .lowStockThreshold(threshold)
                .isLowStock(isLow)
                .updatedAt(inv.getUpdatedAt())
                .build();
    }
}
