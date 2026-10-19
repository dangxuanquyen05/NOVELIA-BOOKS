package com.novelia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("BookMatch Survey REST API Integration Tests")
class BookMatchSurveyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AuthorRepository authorRepository;

    @BeforeEach
    void setUpTestData() {
        Category cat = categoryRepository.save(Category.builder()
                .name("Triết Học & Tư Tưởng")
                .slug("triet-hoc-test-" + UUID.randomUUID())
                .build());
        Author author = authorRepository.save(Author.builder()
                .name("Marcus Aurelius")
                .slug("marcus-aurelius-test-" + UUID.randomUUID())
                .build());
        Book book = bookRepository.save(Book.builder()
                .title("Suy Tưởng Test")
                .slug("suy-tuong-test-" + UUID.randomUUID())
                .isbn("978" + (Math.abs(UUID.randomUUID().hashCode()) % 10000000000L))
                .originalPrice(new BigDecimal("200000"))
                .salePrice(new BigDecimal("160000"))
                .readingLevel("INTERMEDIATE")
                .readingGoals("MINDSET,REFLECTION")
                .language("vi")
                .status(Book.BookStatus.PUBLISHED)
                .categories(Set.of(cat))
                .authors(Set.of(author))
                .build());
        inventoryRepository.save(Inventory.builder()
                .book(book)
                .quantity(25)
                .reservedQuantity(0)
                .build());
    }

    @Test
    @DisplayName("API: GET /api/bookmatch/options trả về danh mục tùy chọn khảo sát")
    void testGetSurveyOptions() throws Exception {
        mockMvc.perform(get("/api/bookmatch/options")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.readingGoals").isArray())
                .andExpect(jsonPath("$.data.readingLevels").isArray())
                .andExpect(jsonPath("$.data.budgetRanges").isArray());
    }

    @Test
    @DisplayName("API: POST /api/bookmatch/recommend với khảo sát hợp lệ")
    void testRecommendBySurveySuccess() throws Exception {
        BookMatchSurveyRequest request = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("MINDSET", "REFLECTION"))
                .preferredLevel("INTERMEDIATE")
                .targetBudget(new BigDecimal("180000"))
                .limit(5)
                .build();

        mockMvc.perform(post("/api/bookmatch/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMatches", greaterThan(0)))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items[0].matchScore", greaterThan(0.0)))
                .andExpect(jsonPath("$.data.items[0].matchReasons").isArray());
    }

    @Test
    @DisplayName("TC-02 & TC-03: Lọc cứng ngân sách (strictBudget = true, maxBudget quá thấp dẫn đến 0 kết quả)")
    void testStrictBudgetFilterZeroResults() throws Exception {
        BookMatchSurveyRequest request = BookMatchSurveyRequest.builder()
                .strictBudget(true)
                .maxBudget(new BigDecimal("50000")) // Không có sách nào dưới 50k
                .build();

        mockMvc.perform(post("/api/bookmatch/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMatches").value(0))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    @DisplayName("TC-07: Đầu vào sai định dạng bị chặn bởi validation (negative budget)")
    void testValidationFailureNegativeBudget() throws Exception {
        BookMatchSurveyRequest request = BookMatchSurveyRequest.builder()
                .targetBudget(new BigDecimal("-50000"))
                .build();

        mockMvc.perform(post("/api/bookmatch/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("API Alias: POST /api/books/recommendations/survey hoạt động đồng bộ")
    void testRecommendBySurveyAliasEndpoint() throws Exception {
        BookMatchSurveyRequest request = BookMatchSurveyRequest.builder()
                .preferredLevel("BEGINNER")
                .limit(4)
                .build();

        mockMvc.perform(post("/api/books/recommendations/survey")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMatches", greaterThan(0)));
    }

    @Test
    @DisplayName("TC-07B: Giới hạn kết quả không hợp lệ (limit = 0 hoặc > 50 bị chặn bởi Bean Validation)")
    void testValidationFailureInvalidLimit() throws Exception {
        BookMatchSurveyRequest requestZero = BookMatchSurveyRequest.builder()
                .limit(0)
                .build();

        mockMvc.perform(post("/api/bookmatch/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestZero)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        BookMatchSurveyRequest requestOver = BookMatchSurveyRequest.builder()
                .limit(99)
                .build();

        mockMvc.perform(post("/api/bookmatch/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestOver)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("TC-06B: Request body rỗng ({}) trả về kết quả gợi ý chuẩn hóa")
    void testRecommendBySurveyEmptyBody() throws Exception {
        mockMvc.perform(post("/api/bookmatch/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMatches", greaterThan(0)));
    }

    @Test
    @DisplayName("Security: Endpoint quản trị nhạy cảm tiếp tục yêu cầu phân quyền đúng quy định")
    void testProtectedAdminEndpointRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/admin/books")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
