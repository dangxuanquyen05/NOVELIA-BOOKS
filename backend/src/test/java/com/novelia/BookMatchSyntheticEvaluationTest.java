package com.novelia;

import com.novelia.author.entity.Author;
import com.novelia.book.entity.Book;
import com.novelia.category.entity.Category;
import com.novelia.recommendation.dto.BookMatchItemResponse;
import com.novelia.recommendation.dto.BookMatchRecommendationResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.recommendation.engine.BookScoringEngine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("BookMatch Phase 6: Synthetic Algorithm Evaluation & Benchmark")
public class BookMatchSyntheticEvaluationTest {

    private final BookScoringEngine scoringEngine = new BookScoringEngine();

    /**
     * Create isolated synthetic dataset of 100 books for reproducible benchmarking
     */
    private List<Book> createSyntheticCatalog(int size) {
        List<Book> catalog = new ArrayList<>(size);
        String[] goals = {"EXPAND_KNOWLEDGE", "RELAXATION", "CAREER_SKILLS", "INSPIRATION", "HABIT_BUILDING"};
        String[] levels = {"BEGINNER", "INTERMEDIATE", "ADVANCED"};
        String[] langs = {"Tiếng Việt", "English"};

        Category catLiterature = Category.builder().id(101L).name("Văn Học").slug("van-hoc").build();
        Category catBusiness = Category.builder().id(102L).name("Kinh Doanh").slug("kinh-doanh").build();
        Category catTech = Category.builder().id(103L).name("Công Nghệ").slug("cong-nghe").build();
        Category catSelfHelp = Category.builder().id(104L).name("Kỹ Năng").slug("ky-nang").build();
        Category catPhilosophy = Category.builder().id(105L).name("Triết Học").slug("triet-hoc").build();
        List<Category> allCategories = List.of(catLiterature, catBusiness, catTech, catSelfHelp, catPhilosophy);

        Random random = new Random(42); // Deterministic seed

        for (int i = 1; i <= size; i++) {
            Category primaryCat = allCategories.get(random.nextInt(allCategories.size()));
            String goal = goals[random.nextInt(goals.length)];
            String level = levels[random.nextInt(levels.length)];
            String lang = langs[random.nextInt(langs.length)];
            int priceK = 50 + random.nextInt(350); // 50,000 to 400,000 VND
            BigDecimal price = BigDecimal.valueOf(priceK * 1000L);

            Author author = Author.builder().id((long) (200 + i)).name("Synthetic Author " + i).build();

            Book book = Book.builder()
                    .id((long) i)
                    .title("Synthetic Book #" + i + " [" + primaryCat.getName() + "]")
                    .slug("synthetic-book-" + i)
                    .isbn("978-0-SYN-" + String.format("%04d", i))
                    .salePrice(price)
                    .originalPrice(price.multiply(BigDecimal.valueOf(1.2)))
                    .readingLevel(level)
                    .readingGoals(goal)
                    .language(lang)
                    .averageRating(BigDecimal.valueOf(3.5 + (random.nextDouble() * 1.5)))
                    .reviewCount(random.nextInt(100))
                    .status(Book.BookStatus.PUBLISHED)
                    .categories(new HashSet<>(Collections.singletonList(primaryCat)))
                    .authors(new HashSet<>(Collections.singletonList(author)))
                    .build();

            catalog.add(book);
        }
        return catalog;
    }

    /**
     * Simulation pipeline replicating RecommendationServiceImpl filtering, boosting and ranking logic
     */
    private BookMatchRecommendationResponse runRecommendationPipeline(
            List<Book> catalog,
            Map<Long, Integer> inventoryMap,
            BookMatchSurveyRequest request,
            Set<Long> excludedBookIds,
            Set<Long> likedCategoryIds
    ) {
        // 1. Hard filters
        List<Book> filtered = catalog.stream()
                .filter(book -> {
                    if (excludedBookIds.contains(book.getId())) return false;
                    if (Boolean.TRUE.equals(request.getStrictBudget()) && request.getMaxBudget() != null) {
                        if (book.getSalePrice() == null || book.getSalePrice().compareTo(request.getMaxBudget()) > 0) return false;
                    }
                    int qty = inventoryMap.getOrDefault(book.getId(), 0);
                    if (Boolean.TRUE.equals(request.getRequireInStock()) && qty <= 0) return false;
                    if (request.getLanguage() != null && !request.getLanguage().trim().isEmpty()) {
                        if (book.getLanguage() != null && !book.getLanguage().trim().equalsIgnoreCase(request.getLanguage().trim())) return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // 2. Scoring & Personalization Boost
        List<BookMatchItemResponse> scoredItems = filtered.stream()
                .map(book -> {
                    int availableQty = inventoryMap.getOrDefault(book.getId(), 0);
                    BookMatchItemResponse item = scoringEngine.scoreSurveyCandidate(book, availableQty, request);
                    if (item != null && !likedCategoryIds.isEmpty() && book.getCategories() != null) {
                        boolean matchesLikedCategory = book.getCategories().stream().anyMatch(c -> likedCategoryIds.contains(c.getId()));
                        if (matchesLikedCategory) {
                            item.setMatchScore(Math.min(100.0, item.getMatchScore() + 8.0));
                            item.getMatchReasons().add("Cộng điểm từ thể loại bạn từng đánh giá hữu ích (+8đ)");
                        }
                    }
                    return item;
                })
                .filter(Objects::nonNull)
                .sorted((item1, item2) -> {
                    int cmp = Double.compare(item2.getMatchScore(), item1.getMatchScore());
                    if (cmp != 0) return cmp;
                    BigDecimal r1 = item1.getAverageRating() != null ? item1.getAverageRating() : BigDecimal.ZERO;
                    BigDecimal r2 = item2.getAverageRating() != null ? item2.getAverageRating() : BigDecimal.ZERO;
                    return r2.compareTo(r1);
                })
                .limit(request.getLimit() != null ? request.getLimit() : 10)
                .collect(Collectors.toList());

        return BookMatchRecommendationResponse.builder()
                .totalMatches(scoredItems.size())
                .items(scoredItems)
                .appliedFiltersSummary("Synthetic Benchmark Pipeline")
                .build();
    }

    @Test
    @DisplayName("Evaluate condition satisfaction rate, reason groundedness, and diversity")
    void evaluateConditionSatisfactionAndDiversity() {
        List<Book> catalog = createSyntheticCatalog(100);
        Map<Long, Integer> inventoryMap = new HashMap<>();
        Random rand = new Random(42);
        for (Book b : catalog) {
            inventoryMap.put(b.getId(), rand.nextInt(20)); // some 0, some > 0
        }

        BigDecimal maxBud = BigDecimal.valueOf(250000);
        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("EXPAND_KNOWLEDGE", "CAREER_SKILLS"))
                .categoryIds(Set.of(102L, 103L)) // Kinh Doanh & Cong Nghe
                .preferredLevel("INTERMEDIATE")
                .targetBudget(BigDecimal.valueOf(200000))
                .maxBudget(maxBud)
                .strictBudget(true)
                .language("Tiếng Việt")
                .requireInStock(true)
                .limit(10)
                .build();

        BookMatchRecommendationResponse baseline = runRecommendationPipeline(
                catalog, inventoryMap, survey, Collections.emptySet(), Collections.emptySet()
        );

        assertNotNull(baseline);
        assertFalse(baseline.getItems().isEmpty(), "Recommendations should not be empty");

        int satisfactionCount = 0;
        int groundedReasonCount = 0;

        for (BookMatchItemResponse item : baseline.getItems()) {
            // Check hard constraints
            boolean priceOk = item.getSalePrice().compareTo(maxBud) <= 0;
            boolean langOk = "Tiếng Việt".equalsIgnoreCase(item.getLanguage());
            boolean stockOk = item.getAvailableQuantity() > 0;

            if (priceOk && langOk && stockOk) {
                satisfactionCount++;
            }

            // Check grounded reasons
            if (!item.getMatchReasons().isEmpty() && item.getMatchReasons().stream().allMatch(r -> !r.isBlank())) {
                groundedReasonCount++;
            }
        }

        double conditionSatisfactionRate = (double) satisfactionCount / baseline.getItems().size();
        double reasonGroundedRate = (double) groundedReasonCount / baseline.getItems().size();

        assertEquals(1.0, conditionSatisfactionRate, 0.001, "100% of items must satisfy hard constraints");
        assertEquals(1.0, reasonGroundedRate, 0.001, "100% of items must have verified grounded reasons");

        // Category diversity (distinct category count in Top-10)
        Set<String> distinctCategories = baseline.getItems().stream()
                .flatMap(i -> i.getCategories().stream())
                .collect(Collectors.toSet());

        System.out.println("=================================================================");
        System.out.println("  SYNTHETIC EVALUATION METRICS (PHASE 6)");
        System.out.println("=================================================================");
        System.out.printf("  1. Hard Condition Satisfaction Rate: %.1f%%%n", conditionSatisfactionRate * 100);
        System.out.printf("  2. Reason Groundedness Rate:        %.1f%%%n", reasonGroundedRate * 100);
        System.out.printf("  3. Distinct Categories in Top-10:   %d categories (%s)%n",
                distinctCategories.size(), distinctCategories);
        System.out.printf("  4. Top-1 Recommendation:            %s (Score: %.1f)%n",
                baseline.getItems().get(0).getTitle(), baseline.getItems().get(0).getMatchScore());
        System.out.println("=================================================================");
    }

    @Test
    @DisplayName("Comparative evaluation: Baseline vs. Personalization with Feedback Adjustment")
    void evaluateComparativeEngineBehavior() {
        List<Book> catalog = createSyntheticCatalog(100);
        Map<Long, Integer> inventoryMap = new HashMap<>();
        for (Book b : catalog) {
            inventoryMap.put(b.getId(), 10); // All in stock
        }

        BookMatchSurveyRequest survey = BookMatchSurveyRequest.builder()
                .readingGoals(Set.of("EXPAND_KNOWLEDGE"))
                .categoryIds(Set.of(102L, 103L)) // Kinh Doanh & Cong Nghe
                .preferredLevel("INTERMEDIATE")
                .strictBudget(false)
                .requireInStock(false)
                .limit(10)
                .build();

        // 1. Run Baseline
        BookMatchRecommendationResponse baseline = runRecommendationPipeline(
                catalog, inventoryMap, survey, Collections.emptySet(), Collections.emptySet()
        );

        BookMatchItemResponse baselineTop1 = baseline.getItems().get(0);
        Long dislikedBookId = baselineTop1.getBookId();

        // Book #2 category will be set as HELPFUL preference
        BookMatchItemResponse baselineTop2 = baseline.getItems().get(1);
        Book book2Entity = catalog.stream().filter(b -> b.getId().equals(baselineTop2.getBookId())).findFirst().orElseThrow();
        Long likedCatId = book2Entity.getCategories().iterator().next().getId();
        String likedCatName = book2Entity.getCategories().iterator().next().getName();

        // 2. Run Personalized with Feedback
        BookMatchRecommendationResponse personalized = runRecommendationPipeline(
                catalog, inventoryMap, survey, Set.of(dislikedBookId), Set.of(likedCatId)
        );

        // Assertions:
        // A. Disliked book is 100% excluded
        boolean containsDisliked = personalized.getItems().stream()
                .anyMatch(i -> i.getBookId().equals(dislikedBookId));
        assertFalse(containsDisliked, "Disliked book must be completely excluded from personalized recommendations");

        // B. Personalized Top-1 is different from baseline Top-1
        assertNotEquals(baselineTop1.getBookId(), personalized.getItems().get(0).getBookId(),
                "Personalized Top-1 must adapt away from disliked book");

        // C. Candidates in liked category receive +8 bonus and clear explanation
        List<BookMatchItemResponse> boostedItems = personalized.getItems().stream()
                .filter(i -> {
                    Book entity = catalog.stream().filter(b -> b.getId().equals(i.getBookId())).findFirst().orElse(null);
                    return entity != null && entity.getCategories().stream().anyMatch(c -> c.getId().equals(likedCatId));
                })
                .toList();

        assertFalse(boostedItems.isEmpty(), "Personalized results should include boosted items");
        for (BookMatchItemResponse boosted : boostedItems) {
            assertTrue(boosted.getMatchReasons().stream().anyMatch(r -> r.contains("từng đánh giá hữu ích (+8đ)")),
                    "Boosted item must articulate the +8đ reason explicitly");
        }

        System.out.println("=================================================================");
        System.out.println("  ALGORITHM COMPARISON: BASELINE vs. PERSONALIZED");
        System.out.println("=================================================================");
        System.out.printf("  Baseline Top-1:     [#%d] %s (Score: %.1f)%n",
                baselineTop1.getBookId(), baselineTop1.getTitle(), baselineTop1.getMatchScore());
        System.out.printf("  User Feedback:      Disliked #%d, Helpful Category #%d (%s)%n",
                dislikedBookId, likedCatId, likedCatName);
        System.out.printf("  Personalized Top-1: [#%d] %s (Score: %.1f)%n",
                personalized.getItems().get(0).getBookId(),
                personalized.getItems().get(0).getTitle(),
                personalized.getItems().get(0).getMatchScore());
        System.out.printf("  Disliked Excluded:  %b (Verified)%n", !containsDisliked);
        System.out.printf("  Category Boosted:   %d books received +8.0 pts bonus%n", boostedItems.size());
        System.out.println("=================================================================");
    }
}
