package com.novelia.recommendation.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.recommendation.dto.BookMatchFeedbackRequest;
import com.novelia.recommendation.dto.BookMatchRecommendationResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.recommendation.dto.UserPreferenceResponse;
import com.novelia.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmatch")
@RequiredArgsConstructor
public class BookMatchController {

    private final RecommendationService recommendationService;

    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<BookMatchRecommendationResponse>> recommendBySurvey(
            @Valid @RequestBody(required = false) BookMatchSurveyRequest request) {
        if (request == null) {
            request = new BookMatchSurveyRequest();
        }
        BookMatchRecommendationResponse response = recommendationService.recommendBySurvey(request);
        return ResponseEntity.ok(ApiResponse.success("Gợi ý sách BookMatch theo khảo sát thành công", response));
    }

    @GetMapping("/options")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSurveyOptions() {
        Map<String, Object> options = Map.of(
                "readingGoals", List.of(
                        Map.of("code", "MINDSET", "label", "Khai phóng tư duy & Phát triển bản thân"),
                        Map.of("code", "REFLECTION", "label", "Chiêm nghiệm sâu sắc & Tĩnh tại nội tâm"),
                        Map.of("code", "PHILOSOPHY", "label", "Triết học & Khám phá tư tưởng"),
                        Map.of("code", "HEALING", "label", "Chữa lành tâm hồn & Cân bằng cảm xúc"),
                        Map.of("code", "ENTERTAINMENT", "label", "Giải trí kịch tính & Thư giãn nhẹ nhàng"),
                        Map.of("code", "DETECTIVE", "label", "Trinh thám & Suy luận logic"),
                        Map.of("code", "CLASSIC", "label", "Văn học kinh điển vượt thời gian"),
                        Map.of("code", "DYSTOPIA", "label", "Dystopia & Tiên tri xã hội")
                ),
                "readingLevels", List.of(
                        Map.of("code", "BEGINNER", "label", "Dễ tiếp cận (Dưới 250 trang, văn phong sáng sủa)"),
                        Map.of("code", "INTERMEDIATE", "label", "Tiêu chuẩn (250 - 450 trang, giàu chiều sâu)"),
                        Map.of("code", "ADVANCED", "label", "Chuyên sâu (Trên 500 trang, đồ sộ hoặc hàn lâm)")
                ),
                "budgetRanges", List.of(
                        Map.of("label", "Dưới 100.000 đ", "maxBudget", 100000),
                        Map.of("label", "100.000 đ - 150.000 đ", "targetBudget", 125000),
                        Map.of("label", "150.000 đ - 250.000 đ", "targetBudget", 200000),
                        Map.of("label", "Trên 250.000 đ", "targetBudget", 300000)
                )
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục tùy chọn khảo sát BookMatch thành công", options));
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<Void>> recordFeedback(
            @Valid @RequestBody BookMatchFeedbackRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                ? auth.getName() : null;
        recommendationService.recordFeedback(userEmail, request);
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận phản hồi gợi ý sách thành công", null));
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<UserPreferenceResponse>> getUserPreferences() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu đăng nhập để truy cập sở thích"));
        }
        UserPreferenceResponse response = recommendationService.getUserPreferences(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin sở thích thành công", response));
    }

    @PostMapping("/preferences")
    public ResponseEntity<ApiResponse<Void>> saveUserPreferences(
            @Valid @RequestBody BookMatchSurveyRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu đăng nhập để lưu sở thích"));
        }
        recommendationService.saveUserPreferences(auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Lưu sở thích sách thành công", null));
    }

    @DeleteMapping("/preferences")
    public ResponseEntity<ApiResponse<Void>> deleteUserPreferences() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Yêu cầu đăng nhập để xóa sở thích"));
        }
        recommendationService.deleteUserPreferences(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa toàn bộ sở thích và lịch sử phản hồi gợi ý", null));
    }
}
