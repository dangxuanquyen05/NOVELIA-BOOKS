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
import com.novelia.recommendation.dto.BookMatchFeedbackRequest;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.user.entity.User;
import com.novelia.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("BookMatch Phase 6: User Feedback & Personalization Tests")
class BookMatchFeedbackPersonalizationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private BookRepository bookRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private AuthorRepository authorRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User testUser1;
    private User testUser2;
    private Book bookPhilosophy1;
    private Book bookPhilosophy2;
    private Book bookDetective;

    @BeforeEach
    void setUpTestData() {
        Category catPhilosophy = categoryRepository.save(Category.builder()
                .name("Triết Học & Tư Tưởng")
                .slug("triet-hoc-p6-" + UUID.randomUUID())
                .build());

        Category catDetective = categoryRepository.save(Category.builder()
                .name("Tiểu Thuyết Trinh Thám")
                .slug("trinh-tham-p6-" + UUID.randomUUID())
                .build());

        Author author1 = authorRepository.save(Author.builder()
                .name("Marcus Aurelius")
                .slug("marcus-p6-" + UUID.randomUUID())
                .build());

        Author author2 = authorRepository.save(Author.builder()
                .name("Arthur Conan Doyle")
                .slug("conan-doyle-p6-" + UUID.randomUUID())
                .build());

        bookPhilosophy1 = bookRepository.save(Book.builder()
                .title("Suy Tưởng 1")
                .slug("suy-tuong-1-" + UUID.randomUUID())
                .isbn("978" + (Math.abs(UUID.randomUUID().hashCode()) % 10000000000L))
                .originalPrice(new BigDecimal("200000"))
                .salePrice(new BigDecimal("160000"))
                .readingLevel("INTERMEDIATE")
                .readingGoals("PHILOSOPHY,REFLECTION")
                .language("vi")
                .status(Book.BookStatus.PUBLISHED)
                .categories(Set.of(catPhilosophy))
                .authors(Set.of(author1))
                .build());
        inventoryRepository.save(Inventory.builder().book(bookPhilosophy1).quantity(20).reservedQuantity(0).build());

        bookPhilosophy2 = bookRepository.save(Book.builder()
                .title("Suy Tưởng 2")
                .slug("suy-tuong-2-" + UUID.randomUUID())
                .isbn("978" + (Math.abs(UUID.randomUUID().hashCode()) % 10000000000L))
                .originalPrice(new BigDecimal("190000"))
                .salePrice(new BigDecimal("150000"))
                .readingLevel("INTERMEDIATE")
                .readingGoals("PHILOSOPHY,REFLECTION")
                .language("vi")
                .status(Book.BookStatus.PUBLISHED)
                .categories(Set.of(catPhilosophy))
                .authors(Set.of(author1))
                .build());
        inventoryRepository.save(Inventory.builder().book(bookPhilosophy2).quantity(15).reservedQuantity(0).build());

        bookDetective = bookRepository.save(Book.builder()
                .title("Sherlock Holmes Vụ Án")
                .slug("sherlock-p6-" + UUID.randomUUID())
                .isbn("978" + (Math.abs(UUID.randomUUID().hashCode()) % 10000000000L))
                .originalPrice(new BigDecimal("120000"))
                .salePrice(new BigDecimal("95000"))
                .readingLevel("BEGINNER")
                .readingGoals("DETECTIVE,ENTERTAINMENT")
                .language("vi")
                .status(Book.BookStatus.PUBLISHED)
                .categories(Set.of(catDetective))
                .authors(Set.of(author2))
                .build());
        inventoryRepository.save(Inventory.builder().book(bookDetective).quantity(30).reservedQuantity(0).build());

        testUser1 = userRepository.save(User.builder()
                .email("user1_p6_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("User One P6")
                .build());

        testUser2 = userRepository.save(User.builder()
                .email("user2_p6_" + UUID.randomUUID() + "@novelia.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("User Two P6")
                .build());
    }

    @Test
    @DisplayName("API: Khách vãng lai gửi phản hồi HELPFUL thành công (không yêu cầu đăng nhập)")
    void testAnonymousFeedbackRecord() throws Exception {
        BookMatchFeedbackRequest request = BookMatchFeedbackRequest.builder()
                .bookId(bookPhilosophy1.getId())
                .feedbackType("HELPFUL")
                .build();

        mockMvc.perform(post("/api/bookmatch/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Khách vãng lai: Danh sách dislikedBookIds loại trừ ngay sách không phù hợp")
    void testGuestDislikedBookIdsExclusion() throws Exception {
        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .dislikedBookIds(Set.of(bookPhilosophy1.getId()))
                .limit(10)
                .build();

        mockMvc.perform(post("/api/bookmatch/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(survey)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[*].bookId", not(hasItem(bookPhilosophy1.getId().intValue()))));
    }

    @Test
    @DisplayName("Người dùng đăng nhập: Lưu và đọc sở thích cá nhân an toàn")
    void testSaveAndGetUserPreferences() throws Exception {
        BookMatchSurveyRequest prefRequest = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("PHILOSOPHY"))
                .preferredLevel("INTERMEDIATE")
                .targetBudget(new BigDecimal("180000"))
                .build();

        // Save preferences
        mockMvc.perform(post("/api/bookmatch/preferences")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testUser1.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prefRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Get preferences
        mockMvc.perform(get("/api/bookmatch/preferences")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testUser1.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.preferredLevel").value("INTERMEDIATE"))
                .andExpect(jsonPath("$.data.readingGoals", hasItem("PHILOSOPHY")));
    }

    @Test
    @DisplayName("Bảo mật ngang (Horizontal RBAC): User 2 không thể thấy sở thích của User 1")
    void testHorizontalIsolationBetweenUsers() throws Exception {
        BookMatchSurveyRequest prefRequest = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("MINDSET"))
                .preferredLevel("ADVANCED")
                .build();

        // User 1 saves
        mockMvc.perform(post("/api/bookmatch/preferences")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testUser1.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prefRequest)))
                .andExpect(status().isOk());

        // User 2 reads their own (must be empty, not User 1's)
        mockMvc.perform(get("/api/bookmatch/preferences")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testUser2.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.preferredLevel").isEmpty())
                .andExpect(jsonPath("$.data.readingGoals", hasSize(0)));
    }

    @Test
    @DisplayName("Quyền riêng tư (Right to be Forgotten): Xóa sạch sở thích và phản hồi")
    void testDeleteUserPreferences() throws Exception {
        BookMatchSurveyRequest prefRequest = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("DETECTIVE"))
                .build();

        // Save
        mockMvc.perform(post("/api/bookmatch/preferences")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testUser1.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prefRequest)))
                .andExpect(status().isOk());

        // Delete
        mockMvc.perform(delete("/api/bookmatch/preferences")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testUser1.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Read again should be empty
        mockMvc.perform(get("/api/bookmatch/preferences")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(testUser1.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.readingGoals", hasSize(0)));
    }

    @Test
    @DisplayName("Bảo mật truy cập: Truy cập sở thích không có token bị từ chối 401")
    void testUnauthenticatedPreferencesAccessDenied() throws Exception {
        mockMvc.perform(get("/api/bookmatch/preferences")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
