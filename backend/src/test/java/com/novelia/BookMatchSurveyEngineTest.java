package com.novelia;

import com.novelia.author.entity.Author;
import com.novelia.book.entity.Book;
import com.novelia.category.entity.Category;
import com.novelia.recommendation.dto.BookMatchItemResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.recommendation.engine.BookScoringEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("BookMatch Survey Engine Unit Tests")
class BookMatchSurveyEngineTest {

    private BookScoringEngine engine;

    @BeforeEach
    void setUp() {
        engine = new BookScoringEngine();
    }

    @Test
    @DisplayName("TC-01: Khớp hoàn hảo thể loại, mục tiêu, độ khó, ngân sách và tồn kho")
    void testPerfectMatchScoring() {
        Category catPhilosophy = Category.builder().id(2L).name("Triết Học & Tư Tưởng").build();
        Author authorMarcus = Author.builder().id(5L).name("Marcus Aurelius").build();

        Book candidate = Book.builder()
                .id(3L)
                .title("Suy Tưởng (Meditations)")
                .categories(Set.of(catPhilosophy))
                .authors(Set.of(authorMarcus))
                .readingLevel("INTERMEDIATE")
                .readingGoals("MINDSET,PHILOSOPHY,REFLECTION")
                .language("vi")
                .salePrice(new BigDecimal("184000"))
                .averageRating(new BigDecimal("4.9"))
                .reviewCount(42)
                .build();

        BookMatchSurveyRequest request = BookMatchSurveyRequest.builder()
                .categoryIds(Set.of(2L))
                .readingGoals(Set.of("MINDSET", "REFLECTION"))
                .preferredLevel("INTERMEDIATE")
                .targetBudget(new BigDecimal("180000"))
                .language("vi")
                .build();

        BookMatchItemResponse response = engine.scoreSurveyCandidate(candidate, 29, request);

        assertNotNull(response);
        assertEquals(3L, response.getBookId());
        assertTrue(response.getMatchScore() >= 85.0, "Sách khớp gần như toàn bộ tiêu chí phải đạt điểm rất cao (>= 85)");
        assertFalse(response.getMatchReasons().isEmpty(), "Phải có danh sách lý do khớp cụ thể");
        assertTrue(response.getMissingAttributes().isEmpty(), "Sách có đủ metadata không được báo thiếu");
        assertTrue(response.getMatchReasons().stream().anyMatch(r -> r.contains("Triết Học")), "Phải có lý do khớp thể loại");
        assertTrue(response.getMatchReasons().stream().anyMatch(r -> r.contains("mục tiêu đọc")), "Phải có lý do khớp mục tiêu đọc");
    }

    @Test
    @DisplayName("TC-04: Metadata bị thiếu (null-safe 100%, không sinh ngoại lệ, có missingAttributes)")
    void testMissingMetadataNullSafety() {
        Book candidateMissing = Book.builder()
                .id(99L)
                .title("Sách cũ chưa gắn metadata")
                .categories(Collections.emptySet())
                .authors(Collections.emptySet())
                .readingLevel(null)
                .readingGoals(null)
                .language(null)
                .salePrice(new BigDecimal("100000"))
                .build();

        BookMatchSurveyRequest request = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("MINDSET"))
                .preferredLevel("BEGINNER")
                .build();

        BookMatchItemResponse response = engine.scoreSurveyCandidate(candidateMissing, 10, request);

        assertNotNull(response);
        assertTrue(response.getMatchScore() > 0.0, "Vẫn tính điểm trung hòa cho sách thiếu metadata");
        assertFalse(response.getMissingAttributes().isEmpty(), "Phải cảnh báo minh bạch các thuộc tính bị thiếu");
        assertTrue(response.getMissingAttributes().stream().anyMatch(m -> m.contains("mục tiêu đọc")));
        assertTrue(response.getMissingAttributes().stream().anyMatch(m -> m.contains("mức độ đọc")));
    }

    @Test
    @DisplayName("TC-05: Sách hết hàng nhận 0 điểm tồn kho")
    void testOutOfStockHandling() {
        Book candidate = Book.builder()
                .id(5L)
                .title("Người Lạ")
                .readingLevel("INTERMEDIATE")
                .readingGoals("PHILOSOPHY")
                .salePrice(new BigDecimal("80000"))
                .build();

        BookMatchSurveyRequest request = BookMatchSurveyRequest.builder()
                .requireInStock(false)
                .build();

        BookMatchItemResponse inStock = engine.scoreSurveyCandidate(candidate, 15, request);
        BookMatchItemResponse outOfStock = engine.scoreSurveyCandidate(candidate, 0, request);

        assertTrue(inStock.getMatchScore() > outOfStock.getMatchScore(), "Sách còn hàng phải có điểm cao hơn sách hết hàng (+5đ tồn kho)");
        assertTrue(outOfStock.getMatchReasons().stream().anyMatch(r -> r.contains("Tạm hết hàng")));
    }

    @Test
    @DisplayName("TC-06: Khảo sát rỗng (người dùng bỏ qua toàn bộ câu hỏi)")
    void testEmptySurveyFallback() {
        Book candidate = Book.builder()
                .id(1L)
                .title("Rừng Na Uy")
                .readingLevel("INTERMEDIATE")
                .readingGoals("REFLECTION")
                .salePrice(new BigDecimal("168000"))
                .averageRating(new BigDecimal("4.8"))
                .reviewCount(50)
                .build();

        BookMatchSurveyRequest emptyRequest = new BookMatchSurveyRequest();

        BookMatchItemResponse response = engine.scoreSurveyCandidate(candidate, 42, emptyRequest);

        assertNotNull(response);
        assertTrue(response.getMatchScore() >= 40.0 && response.getMatchScore() <= 70.0,
                "Khảo sát rỗng phải trả về điểm baseline trung hòa an toàn");
    }
}
