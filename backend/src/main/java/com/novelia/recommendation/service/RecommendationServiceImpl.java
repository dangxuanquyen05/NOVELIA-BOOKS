package com.novelia.recommendation.service;

import com.novelia.author.dto.AuthorResponse;
import com.novelia.author.entity.Author;
import com.novelia.book.dto.BookResponse;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.category.dto.CategoryResponse;
import com.novelia.category.entity.Category;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.order.entity.Order;
import com.novelia.order.entity.OrderItem;
import com.novelia.order.repository.OrderItemRepository;
import com.novelia.order.repository.OrderRepository;
import com.novelia.common.exception.BadRequestException;
import com.novelia.recommendation.dto.BookMatchContext;
import com.novelia.recommendation.dto.BookMatchFeedbackRequest;
import com.novelia.recommendation.dto.BookMatchItemResponse;
import com.novelia.recommendation.dto.BookMatchRecommendationResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.recommendation.dto.UserPreferenceResponse;
import com.novelia.recommendation.engine.BookScoringEngine;
import com.novelia.recommendation.entity.BookMatchFeedback;
import com.novelia.recommendation.entity.UserBookPreference;
import com.novelia.recommendation.repository.BookMatchFeedbackRepository;
import com.novelia.recommendation.repository.UserBookPreferenceRepository;
import com.novelia.user.entity.User;
import com.novelia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InventoryRepository inventoryRepository;
    private final BookScoringEngine bookScoringEngine;
    private final UserBookPreferenceRepository userBookPreferenceRepository;
    private final BookMatchFeedbackRepository bookMatchFeedbackRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getRelatedBooks(String slugOrId, int limit) {
        int safeLimit = limit > 0 && limit <= 20 ? limit : 6;
        Book targetBook = findBookBySlugOrId(slugOrId);

        Set<Long> categoryIds = targetBook.getCategories().stream()
                .map(Category::getId)
                .collect(Collectors.toSet());
        Set<Long> authorIds = targetBook.getAuthors().stream()
                .map(Author::getId)
                .collect(Collectors.toSet());

        BookMatchContext context = BookMatchContext.builder()
                .targetBookId(targetBook.getId())
                .targetCategoryIds(categoryIds)
                .targetAuthorIds(authorIds)
                .targetPrice(targetBook.getSalePrice())
                .build();

        List<Book> candidateBooks = bookRepository.findByStatus(Book.BookStatus.PUBLISHED, PageRequest.of(0, 100))
                .getContent();

        return rankAndMapBooks(candidateBooks, context, safeLimit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getPersonalizedRecommendations(String userEmail, int limit) {
        int safeLimit = limit > 0 && limit <= 20 ? limit : 8;

        BookMatchContext.BookMatchContextBuilder contextBuilder = BookMatchContext.builder();
        Set<Long> preferredCategories = new HashSet<>();
        Set<Long> preferredAuthors = new HashSet<>();
        Set<Long> purchasedBookIds = new HashSet<>();

        if (userEmail != null && !userEmail.trim().isEmpty()) {
            Optional<User> userOpt = userRepository.findByEmail(userEmail.trim());
            if (userOpt.isPresent()) {
                Long userId = userOpt.get().getId();
                List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 10))
                        .getContent();

                for (Order order : orders) {
                    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                    for (OrderItem item : items) {
                        if (item.getBook() != null) {
                            purchasedBookIds.add(item.getBook().getId());
                            if (item.getBook().getCategories() != null) {
                                item.getBook().getCategories().forEach(c -> preferredCategories.add(c.getId()));
                            }
                            if (item.getBook().getAuthors() != null) {
                                item.getBook().getAuthors().forEach(a -> preferredAuthors.add(a.getId()));
                            }
                        }
                    }
                }
            }
        }

        contextBuilder.preferredCategoryIds(preferredCategories);
        contextBuilder.preferredAuthorIds(preferredAuthors);
        contextBuilder.excludedBookIds(purchasedBookIds);

        List<Book> candidateBooks = bookRepository.findByStatus(Book.BookStatus.PUBLISHED, PageRequest.of(0, 100))
                .getContent();

        List<BookResponse> recommended = rankAndMapBooks(candidateBooks, contextBuilder.build(), safeLimit);

        // Fallback: If no candidate matched with positive score, return top rated/featured books
        if (recommended.isEmpty()) {
            recommended = candidateBooks.stream()
                    .filter(b -> !purchasedBookIds.contains(b.getId()))
                    .sorted((b1, b2) -> {
                        int cmp = Boolean.compare(Boolean.TRUE.equals(b2.getIsFeatured()), Boolean.TRUE.equals(b1.getIsFeatured()));
                        if (cmp != 0) return cmp;
                        return b2.getCreatedAt().compareTo(b1.getCreatedAt());
                    })
                    .limit(safeLimit)
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        return recommended;
    }

    @Override
    @Transactional(readOnly = true)
    public BookMatchRecommendationResponse recommendBySurvey(BookMatchSurveyRequest request) {
        if (request == null) {
            request = new BookMatchSurveyRequest();
        }

        int safeLimit = request.getLimit() != null && request.getLimit() > 0 && request.getLimit() <= 50
                ? request.getLimit() : 10;

        List<Book> candidates = bookRepository.findPublishedCandidatesForRecommendation(
                Book.BookStatus.PUBLISHED, PageRequest.of(0, 100));

        if (candidates.isEmpty()) {
            return BookMatchRecommendationResponse.builder()
                    .totalMatches(0)
                    .items(Collections.emptyList())
                    .appliedFiltersSummary("Không có sách nào đang phát hành trong hệ thống")
                    .build();
        }

        // Batch query inventories to avoid N+1 queries
        List<Long> candidateIds = candidates.stream().map(Book::getId).collect(Collectors.toList());
        Map<Long, Integer> inventoryMap = inventoryRepository.findByBookIdIn(candidateIds).stream()
                .collect(Collectors.toMap(
                        inv -> inv.getBook().getId(),
                        Inventory::getAvailableQuantity,
                        (existing, replacement) -> existing
                ));

        // Gather excluded / disliked book IDs
        Set<Long> excludedBookIds = new HashSet<>();
        if (request.getDislikedBookIds() != null) {
            excludedBookIds.addAll(request.getDislikedBookIds());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                ? auth.getName() : null;

        Set<Long> likedCategoryIds = new HashSet<>();
        if (currentEmail != null) {
            userRepository.findByEmail(currentEmail).ifPresent(user -> {
                List<BookMatchFeedback> feedbacks = bookMatchFeedbackRepository.findByUserId(user.getId());
                for (BookMatchFeedback fb : feedbacks) {
                    if (fb.getFeedbackType() == BookMatchFeedback.FeedbackType.NOT_RELEVANT) {
                        excludedBookIds.add(fb.getBook().getId());
                    } else if (fb.getFeedbackType() == BookMatchFeedback.FeedbackType.HELPFUL) {
                        if (fb.getBook().getCategories() != null) {
                            fb.getBook().getCategories().forEach(c -> likedCategoryIds.add(c.getId()));
                        }
                    }
                }
            });
        }

        List<String> activeFilters = new ArrayList<>();

        // 1. Hard filters
        final BookMatchSurveyRequest req = request;
        List<Book> filteredCandidates = candidates.stream()
                .filter(book -> {
                    // Exclude disliked books
                    if (excludedBookIds.contains(book.getId())) {
                        return false;
                    }
                    // Strict budget filter
                    if (Boolean.TRUE.equals(req.getStrictBudget()) && req.getMaxBudget() != null) {
                        if (book.getSalePrice() == null || book.getSalePrice().compareTo(req.getMaxBudget()) > 0) {
                            return false;
                        }
                    }
                    // Require in stock filter
                    int qty = inventoryMap.getOrDefault(book.getId(), 0);
                    if (Boolean.TRUE.equals(req.getRequireInStock()) && qty <= 0) {
                        return false;
                    }
                    // Strict language filter
                    if (req.getLanguage() != null && !req.getLanguage().trim().isEmpty()) {
                        if (book.getLanguage() != null && !book.getLanguage().trim().equalsIgnoreCase(req.getLanguage().trim())) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());

        if (Boolean.TRUE.equals(req.getStrictBudget()) && req.getMaxBudget() != null) {
            activeFilters.add(String.format("Ngân sách tối đa %,d đ (Lọc cứng)", req.getMaxBudget().longValue()));
        }
        if (Boolean.TRUE.equals(req.getRequireInStock())) {
            activeFilters.add("Chỉ lấy sách còn hàng trong kho");
        }
        if (req.getLanguage() != null && !req.getLanguage().trim().isEmpty()) {
            activeFilters.add("Ngôn ngữ: " + req.getLanguage().trim());
        }
        if (!excludedBookIds.isEmpty()) {
            activeFilters.add("Đã loại bỏ " + excludedBookIds.size() + " tác phẩm không phù hợp theo phản hồi");
        }

        // 2. Score and rank candidates
        List<BookMatchItemResponse> scoredItems = filteredCandidates.stream()
                .map(book -> {
                    int availableQty = inventoryMap.getOrDefault(book.getId(), 0);
                    BookMatchItemResponse item = bookScoringEngine.scoreSurveyCandidate(book, availableQty, req);
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
                    // 1st: matchScore desc
                    int cmp = Double.compare(item2.getMatchScore(), item1.getMatchScore());
                    if (cmp != 0) return cmp;
                    // 2nd: averageRating desc
                    BigDecimal r1 = item1.getAverageRating() != null ? item1.getAverageRating() : BigDecimal.ZERO;
                    BigDecimal r2 = item2.getAverageRating() != null ? item2.getAverageRating() : BigDecimal.ZERO;
                    int rCmp = r2.compareTo(r1);
                    if (rCmp != 0) return rCmp;
                    // 3rd: reviewCount desc
                    int rev1 = item1.getReviewCount() != null ? item1.getReviewCount() : 0;
                    int rev2 = item2.getReviewCount() != null ? item2.getReviewCount() : 0;
                    return Integer.compare(rev2, rev1);
                })
                .limit(safeLimit)
                .collect(Collectors.toList());

        String summary = activeFilters.isEmpty() ? "Gợi ý cá nhân hóa dựa trên toàn bộ kho sách"
                : "Đã áp dụng: " + String.join("; ", activeFilters);

        return BookMatchRecommendationResponse.builder()
                .totalMatches(scoredItems.size())
                .items(scoredItems)
                .appliedFiltersSummary(summary)
                .build();
    }

    @Override
    @Transactional
    public void recordFeedback(String userEmail, BookMatchFeedbackRequest request) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + request.getBookId()));

        User user = null;
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            user = userRepository.findByEmail(userEmail.trim()).orElse(null);
        }

        BookMatchFeedback.FeedbackType type = BookMatchFeedback.FeedbackType.valueOf(request.getFeedbackType().trim().toUpperCase());

        BookMatchFeedback feedback = BookMatchFeedback.builder()
                .user(user)
                .book(book)
                .feedbackType(type)
                .build();

        bookMatchFeedbackRepository.save(feedback);
        log.info("Recorded BookMatch feedback {} for book ID {} by user {}", type, book.getId(), userEmail);
    }

    @Override
    @Transactional
    public void saveUserPreferences(String userEmail, BookMatchSurveyRequest request) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new BadRequestException("Cần đăng nhập để lưu sở thích sách");
        }
        User user = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        UserBookPreference pref = userBookPreferenceRepository.findByUserId(user.getId())
                .orElse(UserBookPreference.builder().user(user).build());

        if (request.getReadingGoals() != null && !request.getReadingGoals().isEmpty()) {
            pref.setReadingGoals(String.join(",", request.getReadingGoals()));
        } else {
            pref.setReadingGoals(null);
        }

        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            pref.setPreferredCategories(request.getCategoryIds().stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(",")));
        } else {
            pref.setPreferredCategories(null);
        }

        pref.setPreferredLevel(request.getPreferredLevel());
        pref.setTargetBudget(request.getTargetBudget());

        userBookPreferenceRepository.save(pref);
        log.info("Saved book preferences for user {}", userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public UserPreferenceResponse getUserPreferences(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new BadRequestException("Cần đăng nhập để lấy sở thích sách");
        }
        User user = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        Optional<UserBookPreference> prefOpt = userBookPreferenceRepository.findByUserId(user.getId());
        if (prefOpt.isEmpty()) {
            return new UserPreferenceResponse();
        }

        UserBookPreference pref = prefOpt.get();
        Set<String> goals = (pref.getReadingGoals() != null && !pref.getReadingGoals().trim().isEmpty())
                ? Arrays.stream(pref.getReadingGoals().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toSet())
                : Collections.emptySet();

        Set<Long> categories = (pref.getPreferredCategories() != null && !pref.getPreferredCategories().trim().isEmpty())
                ? Arrays.stream(pref.getPreferredCategories().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(Long::parseLong)
                        .collect(Collectors.toSet())
                : Collections.emptySet();

        return UserPreferenceResponse.builder()
                .readingGoals(goals)
                .categoryIds(categories)
                .preferredLevel(pref.getPreferredLevel())
                .targetBudget(pref.getTargetBudget())
                .updatedAt(pref.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteUserPreferences(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new BadRequestException("Cần đăng nhập để xóa sở thích sách");
        }
        User user = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        userBookPreferenceRepository.deleteByUserId(user.getId());
        bookMatchFeedbackRepository.deleteByUserId(user.getId());
        log.info("Deleted book preferences and feedback history for user {}", userEmail);
    }

    private List<BookResponse> rankAndMapBooks(List<Book> candidates, BookMatchContext context, int limit) {
        return candidates.stream()
                .map(book -> {
                    double score = bookScoringEngine.calculateScore(book, context);
                    return new AbstractMap.SimpleEntry<>(book, score);
                })
                .filter(entry -> entry.getValue() >= 0.0)
                .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
                .limit(limit)
                .map(entry -> mapToResponse(entry.getKey()))
                .collect(Collectors.toList());
    }

    private Book findBookBySlugOrId(String slugOrId) {
        try {
            Long id = Long.parseLong(slugOrId);
            return bookRepository.findById(id)
                    .orElseGet(() -> bookRepository.findBySlug(slugOrId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách: " + slugOrId)));
        } catch (NumberFormatException e) {
            return bookRepository.findBySlug(slugOrId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách: " + slugOrId));
        }
    }

    private BookResponse mapToResponse(Book book) {
        int stockQuantity = inventoryRepository.findByBookId(book.getId())
                .map(Inventory::getAvailableQuantity)
                .orElse(0);

        Set<AuthorResponse> authorResponses = book.getAuthors() != null ? book.getAuthors().stream()
                .map(a -> AuthorResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .slug(a.getSlug())
                        .avatarUrl(a.getAvatarUrl())
                        .nationality(a.getNationality())
                        .build())
                .collect(Collectors.toSet()) : Collections.emptySet();

        Set<CategoryResponse> categoryResponses = book.getCategories() != null ? book.getCategories().stream()
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .parentId(c.getParent() != null ? c.getParent().getId() : null)
                        .name(c.getName())
                        .slug(c.getSlug())
                        .description(c.getDescription())
                        .displayOrder(c.getDisplayOrder())
                        .isActive(c.getIsActive())
                        .build())
                .collect(Collectors.toSet()) : Collections.emptySet();

        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .slug(book.getSlug())
                .isbn(book.getIsbn())
                .coverImage(book.getCoverImage())
                .publisher(book.getPublisher())
                .publicationYear(book.getPublicationYear())
                .pages(book.getPages())
                .dimensions(book.getDimensions())
                .coverType(book.getCoverType() != null ? book.getCoverType().name() : null)
                .originalPrice(book.getOriginalPrice())
                .salePrice(book.getSalePrice())
                .shortDescription(book.getShortDescription())
                .description(book.getDescription())
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .isFeatured(book.getIsFeatured())
                .averageRating(book.getAverageRating())
                .reviewCount(book.getReviewCount())
                .stockQuantity(stockQuantity)
                .readingLevel(book.getReadingLevel())
                .readingGoals(book.getReadingGoals())
                .language(book.getLanguage())
                .authors(authorResponses)
                .categories(categoryResponses)
                .createdAt(book.getCreatedAt())
                .build();
    }
}
