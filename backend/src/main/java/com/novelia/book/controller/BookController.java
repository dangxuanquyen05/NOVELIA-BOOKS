package com.novelia.book.controller;

import com.novelia.book.dto.BookCreateRequest;
import com.novelia.book.dto.BookFilterParams;
import com.novelia.book.dto.BookResponse;
import com.novelia.book.dto.BookUpdateRequest;
import com.novelia.book.service.BookService;
import com.novelia.common.dto.ApiResponse;
import com.novelia.common.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final com.novelia.recommendation.service.RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<BookResponse>>> getBooks(
            @ModelAttribute BookFilterParams params) {
        // By default, if user is not ADMIN or STAFF, restrict to PUBLISHED books only
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isStaffOrAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));

        if (!isStaffOrAdmin && (params.getStatus() == null || params.getStatus().trim().isEmpty())) {
            params.setStatus("PUBLISHED");
        }

        PageResponse<BookResponse> pageResponse = bookService.getBooks(params);
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<java.util.List<BookResponse>>> getRecommendations(
            @RequestParam(defaultValue = "8") int limit) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                ? auth.getName() : null;

        java.util.List<BookResponse> recommendations = recommendationService.getPersonalizedRecommendations(userEmail, limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gợi ý sách BookMatch thành công", recommendations));
    }

    @PostMapping("/recommendations/survey")
    public ResponseEntity<ApiResponse<com.novelia.recommendation.dto.BookMatchRecommendationResponse>> recommendBySurvey(
            @jakarta.validation.Valid @RequestBody(required = false) com.novelia.recommendation.dto.BookMatchSurveyRequest request) {
        if (request == null) {
            request = new com.novelia.recommendation.dto.BookMatchSurveyRequest();
        }
        com.novelia.recommendation.dto.BookMatchRecommendationResponse response = recommendationService.recommendBySurvey(request);
        return ResponseEntity.ok(ApiResponse.success("Gợi ý sách BookMatch theo khảo sát thành công", response));
    }

    @GetMapping("/{slugOrId}/related")
    public ResponseEntity<ApiResponse<java.util.List<BookResponse>>> getRelatedBooks(
            @PathVariable String slugOrId,
            @RequestParam(defaultValue = "6") int limit) {
        java.util.List<BookResponse> related = recommendationService.getRelatedBooks(slugOrId, limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tác phẩm liên quan thành công", related));
    }

    @GetMapping("/{slugOrId}")
    public ResponseEntity<ApiResponse<BookResponse>> getBookDetails(@PathVariable String slugOrId) {
        BookResponse book = bookService.getBookByIdOrSlug(slugOrId);
        return ResponseEntity.ok(ApiResponse.success(book));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<BookResponse>> createBook(@Valid @RequestBody BookCreateRequest request) {
        BookResponse created = bookService.createBook(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm sách mới thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody BookUpdateRequest request) {
        BookResponse updated = bookService.updateBook(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sách thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<BookResponse>> updateBookStatus(
            @PathVariable Long id,
            @RequestParam com.novelia.book.entity.Book.BookStatus status) {
        BookResponse updated = bookService.updateBookStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái sách thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteBook(@PathVariable Long id) {
        String message = bookService.deleteBook(id);
        return ResponseEntity.ok(ApiResponse.success(message, message));
    }
}
