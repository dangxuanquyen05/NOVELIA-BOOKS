package com.novelia.review.repository;

import com.novelia.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByBookIdAndStatusOrderByCreatedAtDesc(Long bookId, Review.ReviewStatus status, Pageable pageable);
    Page<Review> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Review> findByStatusOrderByCreatedAtDesc(Review.ReviewStatus status, Pageable pageable);

    boolean existsByBookIdAndUserId(Long bookId, Long userId);
    Optional<Review> findByBookIdAndUserId(Long bookId, Long userId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.book.id = :bookId AND r.status = 'APPROVED'")
    Double findAverageRatingByBookId(@Param("bookId") Long bookId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.book.id = :bookId AND r.status = 'APPROVED'")
    long countApprovedByBookId(@Param("bookId") Long bookId);

    @Query("SELECT r FROM Review r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:bookId IS NULL OR r.book.id = :bookId) AND " +
           "(:rating IS NULL OR r.rating = :rating) AND " +
           "(:keyword IS NULL OR LOWER(r.book.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(r.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY r.createdAt DESC")
    Page<Review> findReviewsWithFilter(
            @Param("status") Review.ReviewStatus status,
            @Param("bookId") Long bookId,
            @Param("rating") Integer rating,
            @Param("keyword") String keyword,
            Pageable pageable);
}
