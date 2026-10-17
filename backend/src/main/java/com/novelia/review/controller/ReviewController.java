package com.novelia.review.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import com.novelia.review.dto.BookReviewSummaryResponse;
import com.novelia.review.dto.CreateReviewRequest;
import com.novelia.review.dto.ReviewResponse;
import com.novelia.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/books/{bookId}/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getBookReviews(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviewPage = reviewService.getApprovedReviewsByBook(bookId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá thành công", PageResponse.from(reviewPage)));
    }

    @GetMapping("/books/{bookId}/reviews/summary")
    public ResponseEntity<ApiResponse<BookReviewSummaryResponse>> getBookReviewSummary(
            @PathVariable Long bookId) {
        BookReviewSummaryResponse summary = reviewService.getBookReviewSummary(bookId);
        return ResponseEntity.ok(ApiResponse.success("Lấy tổng quan đánh giá thành công", summary));
    }

    @PostMapping("/books/{bookId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long bookId,
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ReviewResponse created = reviewService.createReview(bookId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi đánh giá thành công! Đánh giá sẽ hiển thị sau khi được ban quản trị kiểm duyệt.", created));
    }

    @GetMapping("/reviews/my")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviewPage = reviewService.getMyReviews(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá của tôi thành công", PageResponse.from(reviewPage)));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        reviewService.deleteReview(id, userDetails.getUsername(), false);
        return ResponseEntity.ok(ApiResponse.success("Xóa đánh giá thành công", null));
    }
}
