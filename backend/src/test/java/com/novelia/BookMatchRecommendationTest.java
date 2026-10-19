package com.novelia;

import com.novelia.author.entity.Author;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.entity.Category;
import com.novelia.recommendation.dto.BookMatchContext;
import com.novelia.recommendation.engine.BookScoringEngine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookMatchRecommendationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookScoringEngine bookScoringEngine;

    @Autowired
    private BookRepository bookRepository;

    @Test
    @DisplayName("BookMatch POJO: Candidate cùng thể loại và tác giả đạt điểm tương đồng cao hơn")
    void testScoringEngineMatchingCategoryAndAuthor() {
        Category catVanHoc = Category.builder().id(101L).name("Văn Học").build();
        Author authorHaruki = Author.builder().id(201L).name("Haruki Murakami").build();

        Book candidateRelevant = Book.builder()
                .id(1L)
                .title("Kafka Bên Bờ Biển")
                .categories(Set.of(catVanHoc))
                .authors(Set.of(authorHaruki))
                .averageRating(new BigDecimal("4.8"))
                .reviewCount(25)
                .isFeatured(true)
                .salePrice(new BigDecimal("180000"))
                .build();

        Book candidateUnrelated = Book.builder()
                .id(2L)
                .title("Kinh Tế Vĩ Mô Thực Chiến")
                .categories(Collections.emptySet())
                .authors(Collections.emptySet())
                .averageRating(new BigDecimal("3.0"))
                .reviewCount(2)
                .isFeatured(false)
                .salePrice(new BigDecimal("350000"))
                .build();

        BookMatchContext context = BookMatchContext.builder()
                .targetBookId(999L)
                .targetCategoryIds(Set.of(101L))
                .targetAuthorIds(Set.of(201L))
                .targetPrice(new BigDecimal("175000"))
                .build();

        double scoreRelevant = bookScoringEngine.calculateScore(candidateRelevant, context);
        double scoreUnrelated = bookScoringEngine.calculateScore(candidateUnrelated, context);

        assertTrue(scoreRelevant > scoreUnrelated, "Sách cùng thể loại và tác giả phải có điểm tương đồng cao hơn đáng kể");
        assertTrue(scoreRelevant >= 80.0, "Sách khớp cả thể loại, tác giả, giá và rating cao phải đạt điểm xuất sắc");
    }

    @Test
    @DisplayName("BookMatch POJO: Cuốn sách mục tiêu hoặc sách đã mua bị loại trừ khỏi gợi ý")
    void testScoringEngineExclusion() {
        Book targetBook = Book.builder()
                .id(999L)
                .title("Rừng Na Uy")
                .build();

        BookMatchContext context = BookMatchContext.builder()
                .targetBookId(999L)
                .excludedBookIds(Set.of(888L))
                .build();

        double scoreTarget = bookScoringEngine.calculateScore(targetBook, context);
        assertEquals(-1.0, scoreTarget, "Chính cuốn sách mục tiêu phải bị loại trừ (score = -1.0)");

        Book purchasedBook = Book.builder()
                .id(888L)
                .title("Sách đã mua")
                .build();
        double scorePurchased = bookScoringEngine.calculateScore(purchasedBook, context);
        assertEquals(-1.0, scorePurchased, "Sách nằm trong danh sách loại trừ/đã mua phải có score = -1.0");
    }

    @Test
    @DisplayName("BookMatch API: Endpoint GET /api/books/recommendations trả về gợi ý tuyển chọn thành công")
    void testGetRecommendationsApi() throws Exception {
        mockMvc.perform(get("/api/books/recommendations")
                        .param("limit", "6")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("BookMatch API: Endpoint GET /api/books/{slug}/related trả về tác phẩm liên quan chính xác")
    void testGetRelatedBooksApi() throws Exception {
        Book sampleBook = bookRepository.findByStatus(Book.BookStatus.PUBLISHED, org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().stream().findFirst().orElse(null);

        if (sampleBook != null) {
            mockMvc.perform(get("/api/books/" + sampleBook.getSlug() + "/related")
                            .param("limit", "4")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }
}
