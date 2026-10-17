package com.novelia.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptRequest {

    @Size(max = 50, message = "Mã phiếu không được vượt quá 50 ký tự")
    private String receiptCode;

    @Size(max = 150, message = "Tên nhà cung cấp không được vượt quá 150 ký tự")
    private String supplierName;

    @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
    private String note;

    @NotEmpty(message = "Danh sách sản phẩm nhập không được để trống")
    @Valid
    private List<ReceiptItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiptItem {
        @NotNull(message = "Mã sách không được để trống")
        private Long bookId;

        @NotNull(message = "Số lượng nhập không được để trống")
        @Min(value = 1, message = "Số lượng nhập tối thiểu là 1")
        private Integer quantity;

        private BigDecimal importPrice;
    }
}
