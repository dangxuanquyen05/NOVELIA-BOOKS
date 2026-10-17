package com.novelia.inventory.dto;

import com.novelia.inventory.entity.InventoryTransaction.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAdjustRequest {

    @NotNull(message = "Mã sách không được để trống")
    private Long bookId;

    @NotNull(message = "Số lượng thay đổi không được để trống")
    private Integer quantityChange;

    @NotNull(message = "Loại giao dịch không được để trống")
    private TransactionType transactionType;

    @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
    private String note;
}
