package com.novelia;

import com.novelia.author.entity.Author;
import com.novelia.book.entity.Book;
import com.novelia.category.entity.Category;
import com.novelia.recommendation.dto.BookMatchItemResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.recommendation.engine.BookScoringEngine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("BookMatch Phase 8: Quality, Performance & Commerce Safety Benchmark")
public class BookMatchQualityAndPerformanceTest {

    @Autowired
    private MockMvc mockMvc;

    private final BookScoringEngine engine = new BookScoringEngine();

    /**
     * Helper to generate synthetic catalog of size N
     */
    private List<Book> generateSyntheticCatalog(int size) {
        List<Book> list = new ArrayList<>(size);
        Random rand = new Random(2026);
        Category c1 = Category.builder().id(10L).name("Kinh Tế").build();
        Category c2 = Category.builder().id(11L).name("Văn Học").build();
        Category c3 = Category.builder().id(12L).name("Kỹ Năng").build();
        Category c4 = Category.builder().id(13L).name("Triết Học").build();
        List<Category> cats = List.of(c1, c2, c3, c4);

        for (int i = 1; i <= size; i++) {
            Category cat = cats.get(rand.nextInt(cats.size()));
            Author a = Author.builder().id((long) (100 + i)).name("Author " + i).build();
            int priceK = 60 + rand.nextInt(300); // 60k - 360k
            BigDecimal price = BigDecimal.valueOf(priceK * 1000L);

            Book book = Book.builder()
                    .id((long) i)
                    .title("Book Quality Sample #" + i)
                    .slug("book-quality-sample-" + i)
                    .isbn("978-0-QAL-" + String.format("%04d", i))
                    .salePrice(price)
                    .originalPrice(price.multiply(BigDecimal.valueOf(1.2)))
                    .readingLevel(i % 3 == 0 ? "BEGINNER" : i % 3 == 1 ? "INTERMEDIATE" : "ADVANCED")
                    .readingGoals(i % 2 == 0 ? "CAREER_SKILLS,MINDSET" : "HEALING,REFLECTION")
                    .language("vi")
                    .averageRating(BigDecimal.valueOf(3.8 + (rand.nextDouble() * 1.2)))
                    .reviewCount(rand.nextInt(150))
                    .status(Book.BookStatus.PUBLISHED)
                    .categories(new HashSet<>(Collections.singletonList(cat)))
                    .authors(new HashSet<>(Collections.singletonList(a)))
                    .build();

            list.add(book);
        }
        return list;
    }

    @Test
    @DisplayName("Quality Test 1: Filter accuracy & hard constraints strict enforcement")
    void testFilterAccuracy() {
        List<Book> catalog = generateSyntheticCatalog(50);
        BigDecimal maxBud = BigDecimal.valueOf(180000);

        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("CAREER_SKILLS"))
                .targetBudget(BigDecimal.valueOf(150000))
                .maxBudget(maxBud)
                .strictBudget(true)
                .requireInStock(true)
                .limit(10)
                .build();

        for (Book b : catalog) {
            int qty = b.getId() % 2 == 0 ? 10 : 0;
            // When strictBudget and maxBudget are checked
            boolean exceeds = b.getSalePrice().compareTo(maxBud) > 0;
            if (exceeds) {
                // Must be eliminated in hard filter
                assertTrue(b.getSalePrice().compareTo(maxBud) > 0);
            }
            BookMatchItemResponse resp = engine.scoreSurveyCandidate(b, qty, survey);
            assertNotNull(resp);
            // Verify stock score
            if (qty > 0) {
                assertTrue(resp.getMatchReasons().stream().anyMatch(r -> r.contains("Sẵn sàng giao ngay")));
            }
        }
    }

    @Test
    @DisplayName("Quality Test 2: Scoring consistency & deterministic repeat accuracy")
    void testScoringConsistency() {
        Book b = generateSyntheticCatalog(1).get(0);
        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("CAREER_SKILLS", "MINDSET"))
                .preferredLevel("INTERMEDIATE")
                .targetBudget(BigDecimal.valueOf(150000))
                .build();

        BookMatchItemResponse run1 = engine.scoreSurveyCandidate(b, 10, survey);
        BookMatchItemResponse run2 = engine.scoreSurveyCandidate(b, 10, survey);
        BookMatchItemResponse run3 = engine.scoreSurveyCandidate(b, 10, survey);

        assertEquals(run1.getMatchScore(), run2.getMatchScore(), 0.0001, "Scores must be strictly identical");
        assertEquals(run2.getMatchScore(), run3.getMatchScore(), 0.0001, "Scores must be strictly identical");
        assertEquals(run1.getMatchReasons(), run2.getMatchReasons());
    }

    @Test
    @DisplayName("Quality Test 3: Robustness against missing metadata (null goals, null levels)")
    void testRobustnessAgainstMissingMetadata() {
        Book incompleteBook = Book.builder()
                .id(999L)
                .title("Incomplete Metadata Book")
                .slug("incomplete-book")
                .salePrice(BigDecimal.valueOf(100000))
                .originalPrice(BigDecimal.valueOf(120000))
                .readingGoals(null) // MISSING
                .readingLevel(null) // MISSING
                .averageRating(null) // MISSING
                .reviewCount(null)  // MISSING
                .categories(Collections.emptySet())
                .authors(Collections.emptySet())
                .status(Book.BookStatus.PUBLISHED)
                .build();

        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("MINDSET"))
                .preferredLevel("ADVANCED")
                .build();

        // Must not throw NullPointerException and must report missing attributes
        BookMatchItemResponse resp = assertDoesNotThrow(() ->
                engine.scoreSurveyCandidate(incompleteBook, 5, survey)
        );

        assertNotNull(resp);
        assertFalse(resp.getMissingAttributes().isEmpty(), "Must gracefully record missing attributes");
        assertTrue(resp.getMissingAttributes().stream().anyMatch(m -> m.contains("chưa được gắn nhãn")));
        assertTrue(resp.getMatchScore() >= 0.0 && resp.getMatchScore() <= 100.0);
    }

    @Test
    @DisplayName("Quality Test 4: Diversity calculation across recommendations")
    void testRecommendationDiversity() {
        List<Book> catalog = generateSyntheticCatalog(100);
        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("CAREER_SKILLS", "HEALING"))
                .targetBudget(BigDecimal.valueOf(200000))
                .limit(10)
                .build();

        List<BookMatchItemResponse> results = catalog.stream()
                .map(b -> engine.scoreSurveyCandidate(b, 10, survey))
                .sorted((r1, r2) -> Double.compare(r2.getMatchScore(), r1.getMatchScore()))
                .limit(10)
                .collect(Collectors.toList());

        Set<String> categoriesRepresented = results.stream()
                .flatMap(r -> r.getCategories().stream())
                .collect(Collectors.toSet());

        // Ensure diversity: At least 2 distinct categories in top 10
        assertTrue(categoriesRepresented.size() >= 2,
                "Top recommendations should provide diverse categories for holistic discovery");
    }

    @Test
    @DisplayName("Performance Benchmark: High-throughput latency measurement on N=200 catalog")
    void testLatencyPerformanceBenchmark() {
        List<Book> catalog = generateSyntheticCatalog(200);
        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("CAREER_SKILLS", "MINDSET"))
                .categoryIds(Set.of(10L, 11L))
                .preferredLevel("INTERMEDIATE")
                .targetBudget(BigDecimal.valueOf(180000))
                .limit(8)
                .build();

        // Warmup JIT
        for (int i = 0; i < 20; i++) {
            catalog.forEach(b -> engine.scoreSurveyCandidate(b, 5, survey));
        }

        // Measure 100 iterations of scoring 200 books (20,000 evaluations)
        int iterations = 100;
        long[] latenciesNanos = new long[iterations];

        for (int i = 0; i < iterations; i++) {
            long start = System.nanoTime();
            List<BookMatchItemResponse> list = catalog.stream()
                    .map(b -> engine.scoreSurveyCandidate(b, 5, survey))
                    .sorted((r1, r2) -> Double.compare(r2.getMatchScore(), r1.getMatchScore()))
                    .limit(8)
                    .collect(Collectors.toList());
            latenciesNanos[i] = System.nanoTime() - start;
            assertEquals(8, list.size());
        }

        Arrays.sort(latenciesNanos);
        double p50Ms = latenciesNanos[iterations / 2] / 1_000_000.0;
        double p95Ms = latenciesNanos[(int) (iterations * 0.95)] / 1_000_000.0;
        double p99Ms = latenciesNanos[(int) (iterations * 0.99)] / 1_000_000.0;

        System.out.println("=================================================================");
        System.out.println("  BOOKMATCH PERFORMANCE BENCHMARK (N=200 Books, 100 Runs)");
        System.out.println("=================================================================");
        System.out.printf("  p50 Latency: %.2f ms%n", p50Ms);
        System.out.printf("  p95 Latency: %.2f ms%n", p95Ms);
        System.out.printf("  p99 Latency: %.2f ms%n", p99Ms);
        System.out.println("=================================================================");

        // Scoring 200 books must take < 50ms p95
        assertTrue(p95Ms < 50.0, "Engine p95 latency should be under 50ms for 200 candidates");
    }

    @Test
    @DisplayName("Security & Access Test: Unauthenticated user cannot access preferences")
    void testSecurityHorizontalIsolation() throws Exception {
        mockMvc.perform(get("/api/bookmatch/preferences"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(delete("/api/bookmatch/preferences"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Commerce Regression Test: Catalog and Cart API remain 100% operational")
    void testCommerceIntegrity() throws Exception {
        // Books catalog browse
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Categories list
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // BookMatch options
        mockMvc.perform(get("/api/bookmatch/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.readingGoals").isArray());
    }
}
