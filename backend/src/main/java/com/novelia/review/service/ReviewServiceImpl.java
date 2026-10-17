package com.novelia.review.service;

import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.order.entity.Order;
import com.novelia.order.repository.OrderRepository;
import com.novelia.review.dto.BookReviewSummaryResponse;
import com.novelia.review.dto.CreateReviewRequest;
import com.novelia.review.dto.ModerateReviewRequest;
import com.novelia.review.dto.ReviewResponse;
import com.novelia.review.entity.Review;
import com.novelia.review.repository.ReviewRepository;
import com.novelia.user.entity.User;
import com.novelia.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final com.novelia.audit.service.AuditLogService auditLogService;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            BookRepository bookRepository,
            UserRepository userRepository,
            OrderRepository orderRepository,
            com.novelia.audit.service.AuditLogService auditLogService) {
        this.reviewRepository = reviewRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public ReviewResponse createReview(Long bookId, CreateReviewRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản: " + userEmail));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác phẩm với ID: " + bookId));

        // Verify real purchase: Must have an order with DELIVERED status containing this book
        List<Order> deliveredOrders = orderRepository.findDeliveredOrdersByCustomerAndBook(user.getId(), bookId, Order.OrderStatus.DELIVERED);
        if (deliveredOrders.isEmpty()) {
            throw new BadRequestException("Bạn chỉ có thể đánh giá những tác phẩm đã mua và nhận hàng thành công (Trạng thái đơn: Đã giao hàng)");
        }
        Order order = deliveredOrders.get(0);

        // Check if user already reviewed this book
        Review review = reviewRepository.findByBookIdAndUserId(bookId, user.getId()).orElse(null);
        if (review != null) {
            // Update existing review and set back to PENDING for re-moderation
            review.setRating(request.getRating());
            review.setComment(request.getComment().trim());
            review.setStatus(Review.ReviewStatus.PENDING);
            review.setIsApproved(false);
            review.setIsVerifiedPurchase(true);
            review.setRejectionReason(null);
            review.setModeratedAt(null);
            review.setModeratedBy(null);
            review.setOrder(order);
            Review updated = reviewRepository.save(review);
            log.info("User {} updated review ID {} for book ID {}. Status set to PENDING for moderation.", userEmail, updated.getId(), bookId);
            return mapToResponse(updated);
        }

        Review newReview = Review.builder()
                .book(book)
                .user(user)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment().trim())
                .status(Review.ReviewStatus.PENDING)
                .isApproved(false)
                .isVerifiedPurchase(true)
                .build();

        Review saved = reviewRepository.save(newReview);
        log.info("User {} created review ID {} for book ID {}. Status: PENDING (Waiting for moderation).", userEmail, saved.getId(), bookId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getApprovedReviewsByBook(Long bookId, Pageable pageable) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Không tìm thấy tác phẩm với ID: " + bookId);
        }
        return reviewRepository.findByBookIdAndStatusOrderByCreatedAtDesc(bookId, Review.ReviewStatus.APPROVED, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BookReviewSummaryResponse getBookReviewSummary(Long bookId) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Không tìm thấy tác phẩm với ID: " + bookId);
        }

        Double rawAvg = reviewRepository.findAverageRatingByBookId(bookId);
        long totalReviews = reviewRepository.countApprovedByBookId(bookId);

        BigDecimal roundedAvg = BigDecimal.valueOf(rawAvg != null ? rawAvg : 0.0)
                .setScale(1, RoundingMode.HALF_UP);

        // Group star counts for approved reviews
        Page<Review> allApproved = reviewRepository.findByBookIdAndStatusOrderByCreatedAtDesc(bookId, Review.ReviewStatus.APPROVED, PageRequest.of(0, 1000));
        Map<Integer, Long> starCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            starCounts.put(i, 0L);
        }
        for (Review r : allApproved.getContent()) {
            int rating = r.getRating();
            starCounts.put(rating, starCounts.getOrDefault(rating, 0L) + 1);
        }

        return BookReviewSummaryResponse.builder()
                .bookId(bookId)
                .averageRating(roundedAvg.doubleValue())
                .totalReviews(totalReviews)
                .starCounts(starCounts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getMyReviews(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản: " + userEmail));
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviewsForModeration(Review.ReviewStatus status, Pageable pageable) {
        return getAllReviewsForModeration(status, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviewsForModeration(
            Review.ReviewStatus status,
            Long bookId,
            Integer rating,
            String keyword,
            Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return reviewRepository.findReviewsWithFilter(status, bookId, rating, cleanKeyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ReviewResponse moderateReview(Long reviewId, ModerateReviewRequest request, String moderatorEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        if (request.getStatus() == Review.ReviewStatus.REJECTED &&
                (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty())) {
            throw new BadRequestException("Vui lòng nêu rõ lý do từ chối đánh giá");
        }

        review.setStatus(request.getStatus());
        review.setIsApproved(request.getStatus() == Review.ReviewStatus.APPROVED);
        review.setRejectionReason(request.getStatus() == Review.ReviewStatus.REJECTED ? request.getRejectionReason().trim() : null);
        review.setModeratedAt(LocalDateTime.now());
        review.setModeratedBy(moderatorEmail);

        Review saved = reviewRepository.save(review);
        // Automatically sync book's average rating and total approved review count
        updateBookRatingAndReviewCount(saved.getBook());
        log.info("Review ID {} moderated to {} by {}", reviewId, request.getStatus(), moderatorEmail);

        auditLogService.log(moderatorEmail, "REVIEW_MODERATE", "REVIEW", reviewId.toString(),
                "Kiểm duyệt đánh giá #" + reviewId + " -> " + request.getStatus(),
                "Sách: " + saved.getBook().getTitle() + ", Điểm: " + saved.getRating() + " sao, Trạng thái: " + request.getStatus() + (request.getRejectionReason() != null ? ", Lý do từ chối: " + request.getRejectionReason() : ""));

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, String userEmail, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        if (!isAdmin && !review.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("Bạn không có quyền xóa đánh giá của người khác");
        }

        Book book = review.getBook();
        reviewRepository.delete(review);
        updateBookRatingAndReviewCount(book);
        log.info("Review ID {} deleted by {}", reviewId, userEmail);

        auditLogService.log(userEmail, "REVIEW_DELETE", "REVIEW", reviewId.toString(),
                "Xóa đánh giá #" + reviewId + " của sách: " + book.getTitle(),
                "Người thực hiện: " + userEmail + ", Vai trò Admin: " + isAdmin);
    }

    private void updateBookRatingAndReviewCount(Book book) {
        if (book == null) return;
        Double rawAvg = reviewRepository.findAverageRatingByBookId(book.getId());
        long approvedCount = reviewRepository.countApprovedByBookId(book.getId());
        BigDecimal avgRating = (rawAvg != null && rawAvg > 0)
                ? BigDecimal.valueOf(rawAvg).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        book.setAverageRating(avgRating);
        book.setReviewCount((int) approvedCount);
        bookRepository.save(book);
        log.info("Synced Book ID {} rating: {}, review count: {}", book.getId(), avgRating, approvedCount);
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookId(review.getBook().getId())
                .bookTitle(review.getBook().getTitle())
                .userId(review.getUser().getId())
                .userFullName(review.getUser().getFullName())
                .orderId(review.getOrder() != null ? review.getOrder().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus() != null ? review.getStatus().name() : (Boolean.TRUE.equals(review.getIsApproved()) ? "APPROVED" : "PENDING"))
                .isApproved(review.getIsApproved())
                .isVerifiedPurchase(Boolean.TRUE.equals(review.getIsVerifiedPurchase()))
                .rejectionReason(review.getRejectionReason())
                .moderatedAt(review.getModeratedAt())
                .moderatedBy(review.getModeratedBy())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
