package com.novelia.recommendation.repository;

import com.novelia.recommendation.entity.BookMatchFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookMatchFeedbackRepository extends JpaRepository<BookMatchFeedback, Long> {
    List<BookMatchFeedback> findByUserId(Long userId);
    List<BookMatchFeedback> findByUserIdAndFeedbackType(Long userId, BookMatchFeedback.FeedbackType feedbackType);
    void deleteByUserId(Long userId);
}
