package com.novelia.review.service;

import com.novelia.review.dto.BookReviewSummaryResponse;
import com.novelia.review.dto.CreateReviewRequest;
import com.novelia.review.dto.ModerateReviewRequest;
import com.novelia.review.dto.ReviewResponse;
import com.novelia.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse createReview(Long bookId, CreateReviewRequest request, String userEmail);
    Page<ReviewResponse> getApprovedReviewsByBook(Long bookId, Pageable pageable);
    BookReviewSummaryResponse getBookReviewSummary(Long bookId);
    Page<ReviewResponse> getMyReviews(String userEmail, Pageable pageable);
    Page<ReviewResponse> getAllReviewsForModeration(Review.ReviewStatus status, Pageable pageable);
    Page<ReviewResponse> getAllReviewsForModeration(Review.ReviewStatus status, Long bookId, Integer rating, String keyword, Pageable pageable);
    ReviewResponse moderateReview(Long reviewId, ModerateReviewRequest request, String moderatorEmail);
    void deleteReview(Long reviewId, String userEmail, boolean isAdmin);
}
