package com.novelia.review.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.review.dto.ModerateReviewRequest;
import com.novelia.review.dto.ReviewResponse;
import com.novelia.review.entity.Review;
import com.novelia.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminReviewController {

    private final ReviewService reviewService;

    public AdminReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getAllReviews(
            @RequestParam(required = false) Review.ReviewStatus status,
            @RequestParam(required = false) Long bookId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviewPage = reviewService.getAllReviewsForModeration(status, bookId, rating, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá kiểm duyệt thành công", PageResponse.from(reviewPage)));
    }

    @PutMapping("/{id}/moderate")
    public ResponseEntity<ApiResponse<ReviewResponse>> moderateReview(
            @PathVariable Long id,
            @Valid @RequestBody ModerateReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ReviewResponse moderated = reviewService.moderateReview(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Kiểm duyệt đánh giá thành công", moderated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        reviewService.deleteReview(id, userDetails.getUsername(), true);
        return ResponseEntity.ok(ApiResponse.success("Xóa đánh giá thành công", null));
    }
}
