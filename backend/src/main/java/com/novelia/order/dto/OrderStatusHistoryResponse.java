package com.novelia.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryResponse {
    private Long id;
    private String fromStatus;
    private String toStatus;
    private String action;
    private String changedBy;
    private String note;
    private LocalDateTime createdAt;
}
