package com.novelia.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventorySummaryResponse {
    private long totalBooks;
    private long inStockCount;
    private long lowStockCount;
    private long outOfStockCount;
    private long totalPhysicalStock;
}
