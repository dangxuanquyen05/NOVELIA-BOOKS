package com.novelia.recommendation.engine;

import com.novelia.author.entity.Author;
import com.novelia.book.entity.Book;
import com.novelia.category.entity.Category;
import com.novelia.recommendation.dto.BookMatchContext;
import com.novelia.recommendation.dto.BookMatchItemResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Pure POJO Domain Scoring Engine for BookMatch Recommendations.
 * Implements Content-Based Filtering & Normalized Multi-Criteria Heuristics.
 */
@Component
public class BookScoringEngine {

    /**
     * Legacy heuristic calculation for related & personalized books.
     */
    public double calculateScore(Book candidate, BookMatchContext context) {
        if (candidate == null || context == null) {
            return 0.0;
        }

        // Exclude the current book or already purchased books
        if (context.getTargetBookId() != null && context.getTargetBookId().equals(candidate.getId())) {
            return -1.0;
        }
        if (context.getExcludedBookIds() != null && context.getExcludedBookIds().contains(candidate.getId())) {
            return -1.0;
        }

        double score = 0.0;

        // 1. Category Matching (+35 pts per matching category, max 50 pts)
        double categoryScore = 0.0;
        if (candidate.getCategories() != null && !candidate.getCategories().isEmpty()) {
            for (Category c : candidate.getCategories()) {
                if (context.getTargetCategoryIds() != null && context.getTargetCategoryIds().contains(c.getId())) {
                    categoryScore += 35.0;
                } else if (context.getPreferredCategoryIds() != null && context.getPreferredCategoryIds().contains(c.getId())) {
                    categoryScore += 25.0;
                }
            }
        }
        score += Math.min(categoryScore, 50.0);

        // 2. Author Matching (+30 pts per matching author, max 40 pts)
        double authorScore = 0.0;
        if (candidate.getAuthors() != null && !candidate.getAuthors().isEmpty()) {
            for (Author a : candidate.getAuthors()) {
                if (context.getTargetAuthorIds() != null && context.getTargetAuthorIds().contains(a.getId())) {
                    authorScore += 30.0;
                } else if (context.getPreferredAuthorIds() != null && context.getPreferredAuthorIds().contains(a.getId())) {
                    authorScore += 20.0;
                }
            }
        }
        score += Math.min(authorScore, 40.0);

        // 3. Rating Weight (up to 15 pts)
        if (candidate.getAverageRating() != null && candidate.getAverageRating().compareTo(BigDecimal.ZERO) > 0) {
            double rating = candidate.getAverageRating().doubleValue();
            score += Math.min((rating / 5.0) * 15.0, 15.0);
        }

        // 4. Popularity / Review Count Bonus (up to 5 pts)
        if (candidate.getReviewCount() != null && candidate.getReviewCount() > 0) {
            score += Math.min(candidate.getReviewCount() * 0.5, 5.0);
        }

        // 5. Featured Bonus (+5 pts)
        if (Boolean.TRUE.equals(candidate.getIsFeatured())) {
            score += 5.0;
        }

        // 6. Price Proximity (up to 10 pts)
        if (context.getTargetPrice() != null && context.getTargetPrice().compareTo(BigDecimal.ZERO) > 0
                && candidate.getSalePrice() != null && candidate.getSalePrice().compareTo(BigDecimal.ZERO) > 0) {
            double targetP = context.getTargetPrice().doubleValue();
            double candP = candidate.getSalePrice().doubleValue();
            double diffRatio = Math.abs(candP - targetP) / targetP;
            if (diffRatio <= 0.35) {
                score += (1.0 - (diffRatio / 0.35)) * 10.0;
            }
        }

        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    /**
     * Multi-criteria normalized scoring for BookMatch Personalized Survey.
     * Normalized scale: 0.0 to 100.0 pts.
     */
    public BookMatchItemResponse scoreSurveyCandidate(Book candidate, int availableQuantity, BookMatchSurveyRequest request) {
        if (candidate == null) {
            return null;
        }

        List<String> matchReasons = new ArrayList<>();
        List<String> missingAttributes = new ArrayList<>();
        double totalScore = 0.0;

        // 1. Thể loại & Chủ đề (Max 35.0 pts)
        double categoryScore = 0.0;
        Set<String> categoryNames = candidate.getCategories() != null ? candidate.getCategories().stream()
                .map(Category::getName)
                .collect(Collectors.toSet()) : Collections.emptySet();

        if (request != null && request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            List<String> matchedCats = new ArrayList<>();
            if (candidate.getCategories() != null) {
                for (Category c : candidate.getCategories()) {
                    if (request.getCategoryIds().contains(c.getId())) {
                        matchedCats.add(c.getName());
                        categoryScore += 25.0;
                    }
                }
            }
            categoryScore = Math.min(categoryScore, 35.0);
            if (!matchedCats.isEmpty()) {
                matchReasons.add("Khớp thể loại yêu thích: " + String.join(", ", matchedCats) + " (+" + String.format("%.0f", categoryScore) + "đ)");
            }
        } else {
            // Neutral baseline if user skipped categories
            categoryScore = 15.0;
        }
        totalScore += categoryScore;

        // 2. Mục tiêu đọc (Max 30.0 pts)
        double goalScore = 0.0;
        if (candidate.getReadingGoals() == null || candidate.getReadingGoals().trim().isEmpty()) {
            missingAttributes.add("Sách chưa được gắn nhãn mục tiêu đọc chuyên sâu (điểm được chuẩn hóa trung hòa)");
            goalScore = 10.0;
        } else {
            Set<String> bookGoals = Arrays.stream(candidate.getReadingGoals().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(String::toUpperCase)
                    .collect(Collectors.toSet());

            if (request != null && request.getReadingGoals() != null && !request.getReadingGoals().isEmpty()) {
                List<String> matchedGoals = new ArrayList<>();
                for (String userGoal : request.getReadingGoals()) {
                    if (userGoal != null && bookGoals.contains(userGoal.trim().toUpperCase())) {
                        matchedGoals.add(userGoal.trim().toUpperCase());
                        goalScore += 15.0;
                    }
                }
                goalScore = Math.min(goalScore, 30.0);
                if (!matchedGoals.isEmpty()) {
                    matchReasons.add("Khớp mục tiêu đọc: " + String.join(", ", matchedGoals) + " (+" + String.format("%.0f", goalScore) + "đ)");
                }
            } else {
                // Neutral baseline if user skipped reading goals
                goalScore = 10.0;
            }
        }
        totalScore += goalScore;

        // 3. Mức độ chuyên sâu (Max 15.0 pts)
        double levelScore = 0.0;
        if (candidate.getReadingLevel() == null || candidate.getReadingLevel().trim().isEmpty()) {
            missingAttributes.add("Sách chưa được định danh mức độ đọc (chuẩn hóa trung hòa)");
            levelScore = 7.5;
        } else {
            if (request != null && request.getPreferredLevel() != null && !request.getPreferredLevel().trim().isEmpty()) {
                int candVal = parseLevelValue(candidate.getReadingLevel());
                int reqVal = parseLevelValue(request.getPreferredLevel());
                int dist = Math.abs(candVal - reqVal);
                if (dist == 0) {
                    levelScore = 15.0;
                    matchReasons.add("Phù hợp mức độ đọc chuyên sâu: " + candidate.getReadingLevel() + " (+15đ)");
                } else if (dist == 1) {
                    levelScore = 7.5;
                    matchReasons.add("Gần với mức độ đọc mong muốn (+7.5đ)");
                } else {
                    levelScore = 0.0;
                }
            } else {
                levelScore = 10.0;
            }
        }
        totalScore += levelScore;

        // 4. Tối ưu Ngân sách (Max 10.0 pts)
        double budgetScore = 0.0;
        if (request != null && request.getTargetBudget() != null && request.getTargetBudget().compareTo(BigDecimal.ZERO) > 0
                && candidate.getSalePrice() != null && candidate.getSalePrice().compareTo(BigDecimal.ZERO) > 0) {
            double targetP = request.getTargetBudget().doubleValue();
            double candP = candidate.getSalePrice().doubleValue();
            double diffRatio = Math.abs(candP - targetP) / targetP;
            if (diffRatio <= 0.35) {
                budgetScore = (1.0 - (diffRatio / 0.35)) * 10.0;
                matchReasons.add(String.format("Rất gần ngân sách mong muốn (%,d đ so với %,d đ) (+%.1fđ)",
                        candidate.getSalePrice().longValue(), request.getTargetBudget().longValue(), budgetScore));
            } else {
                budgetScore = 0.0;
            }
        } else {
            budgetScore = 7.0;
        }
        totalScore += budgetScore;

        // 5. Tồn kho sẵn sàng (Max 5.0 pts)
        double stockScore = 0.0;
        if (availableQuantity > 0) {
            stockScore = 5.0;
            matchReasons.add("Sẵn sàng giao ngay (còn " + availableQuantity + " cuốn) (+5đ)");
        } else {
            stockScore = 0.0;
            if (request != null && !Boolean.TRUE.equals(request.getRequireInStock())) {
                matchReasons.add("Tạm hết hàng (0đ điểm tồn kho)");
            }
        }
        totalScore += stockScore;

        // 6. Đánh giá & Uy tín (Max 5.0 pts)
        double repScore = 0.0;
        double rating = candidate.getAverageRating() != null ? candidate.getAverageRating().doubleValue() : 0.0;
        int reviewCount = candidate.getReviewCount() != null ? candidate.getReviewCount() : 0;
        repScore = Math.min(5.0, (rating / 5.0) * 3.0 + Math.min(reviewCount * 0.2, 2.0));
        if (repScore >= 3.0) {
            matchReasons.add(String.format("Được bạn đọc đánh giá cao (%.1f★, %d đánh giá) (+%.1fđ)", rating, reviewCount, repScore));
        }
        totalScore += repScore;

        // Chuẩn hóa điểm từ 0 đến 100
        double finalScore = BigDecimal.valueOf(Math.min(100.0, Math.max(0.0, totalScore)))
                .setScale(1, RoundingMode.HALF_UP).doubleValue();

        Set<String> authorNames = candidate.getAuthors() != null ? candidate.getAuthors().stream()
                .map(Author::getName)
                .collect(Collectors.toSet()) : Collections.emptySet();

        return BookMatchItemResponse.builder()
                .bookId(candidate.getId())
                .title(candidate.getTitle())
                .slug(candidate.getSlug())
                .isbn(candidate.getIsbn())
                .coverImage(candidate.getCoverImage())
                .originalPrice(candidate.getOriginalPrice())
                .salePrice(candidate.getSalePrice())
                .availableQuantity(availableQuantity)
                .readingLevel(candidate.getReadingLevel())
                .readingGoals(candidate.getReadingGoals())
                .language(candidate.getLanguage())
                .averageRating(candidate.getAverageRating())
                .reviewCount(candidate.getReviewCount())
                .authors(authorNames)
                .categories(categoryNames)
                .matchScore(finalScore)
                .matchReasons(matchReasons)
                .missingAttributes(missingAttributes)
                .build();
    }

    private int parseLevelValue(String level) {
        if (level == null) return 2;
        return switch (level.trim().toUpperCase()) {
            case "BEGINNER" -> 1;
            case "ADVANCED" -> 3;
            default -> 2; // INTERMEDIATE
        };
    }
}
