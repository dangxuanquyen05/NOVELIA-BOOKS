package com.novelia.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private Long userId;
    private String userFullName;
    private Long orderId;
    private Integer rating;
    private String comment;
    private String status;
    private Boolean isApproved;
    private Boolean isVerifiedPurchase;
    private String rejectionReason;
    private LocalDateTime moderatedAt;
    private String moderatedBy;
    private LocalDateTime createdAt;
}
