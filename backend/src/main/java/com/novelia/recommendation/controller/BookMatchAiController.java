package com.novelia.recommendation.controller;

import com.novelia.common.dto.ApiResponse;
import com.novelia.recommendation.ai.dto.AiAssistantResponse;
import com.novelia.recommendation.ai.dto.AiQueryParseRequest;
import com.novelia.recommendation.ai.dto.AiStatusResponse;
import com.novelia.recommendation.ai.dto.ParsedCriteriaResult;
import com.novelia.recommendation.ai.service.AiRecommendationFacadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmatch/ai")
@RequiredArgsConstructor
public class BookMatchAiController {

    private final AiRecommendationFacadeService aiFacadeService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<AiStatusResponse>> getStatus() {
        AiStatusResponse status = aiFacadeService.getStatus();
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra trạng thái trợ lý AI thành công", status));
    }

    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<ParsedCriteriaResult>> parseNaturalQuery(
            @Valid @RequestBody AiQueryParseRequest request) {
        ParsedCriteriaResult result = aiFacadeService.parseQuery(request);
        return ResponseEntity.ok(ApiResponse.success("Phân tích câu hỏi tự nhiên thành tiêu chí tìm sách thành công", result));
    }

    @PostMapping("/assistant")
    public ResponseEntity<ApiResponse<AiAssistantResponse>> processAssistantQuery(
            @Valid @RequestBody AiQueryParseRequest request) {
        AiAssistantResponse response = aiFacadeService.processAssistantQuery(request);
        return ResponseEntity.ok(ApiResponse.success("Đã tìm kiếm sách phù hợp theo ngôn ngữ tự nhiên thành công", response));
    }
}
