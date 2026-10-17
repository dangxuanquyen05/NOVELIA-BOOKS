package com.novelia.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookReviewSummaryResponse {
    private Long bookId;
    private Double averageRating;
    private long totalReviews;
    private Map<Integer, Long> starCounts; // 5->count, 4->count...
}
