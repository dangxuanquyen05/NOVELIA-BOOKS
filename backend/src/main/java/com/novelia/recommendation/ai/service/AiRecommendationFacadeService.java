package com.novelia.recommendation.ai.service;

import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.common.exception.BadRequestException;
import com.novelia.recommendation.ai.config.AiProperties;
import com.novelia.recommendation.ai.dto.AiAssistantResponse;
import com.novelia.recommendation.ai.dto.AiQueryParseRequest;
import com.novelia.recommendation.ai.dto.AiStatusResponse;
import com.novelia.recommendation.ai.dto.ParsedCriteriaResult;
import com.novelia.recommendation.dto.BookMatchRecommendationResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationFacadeService {

    private final AiProperties aiProperties;
    private final GeminiIntentParserClient geminiClient;
    private final RuleBasedIntentParser ruleBasedParser;
    private final CategoryRepository categoryRepository;
    private final RecommendationService recommendationService;

    /**
     * Get operational status of AI integration.
     */
    public AiStatusResponse getStatus() {
        boolean credentialsConfigured = aiProperties.hasValidCredentials();
        boolean enabled = aiProperties.isEnabled() && credentialsConfigured;
        String statusMessage = enabled
                ? "Trợ lý AI đang hoạt động với Google Gemini API (kèm cơ chế dự phòng offline)."
                : "Trợ lý BookMatch đang hoạt động ở chế độ Dự phòng Offline (Rule-based NLP Engine).";

        return AiStatusResponse.builder()
                .aiEnabled(enabled)
                .credentialsConfigured(credentialsConfigured)
                .provider(enabled ? aiProperties.getProvider() : "rule-based-fallback")
                .model(aiProperties.getModel())
                .fallbackAvailable(true)
                .rateLimitPerMinute(aiProperties.getRateLimitPerMinute())
                .statusMessage(statusMessage)
                .build();
    }

    /**
     * Parse natural language query into structured criteria.
     */
    public ParsedCriteriaResult parseQuery(AiQueryParseRequest request) {
        validateInput(request);
        List<Category> categories = categoryRepository.findAll();

        // 1. Try Gemini AI if enabled & configured
        ParsedCriteriaResult result = geminiClient.parseWithGemini(request.getQuery(), categories);

        // 2. Graceful fallback if AI is disabled, errored, timed out, or quota exceeded
        if (result == null) {
            log.info("Using RuleBasedIntentParser for query: '{}'", request.getQuery());
            result = ruleBasedParser.parseNaturalQuery(request.getQuery(), categories);
        }

        return result;
    }

    /**
     * End-to-end Assistant Flow:
     * Natural Query -> AI/Rule-based Parsing -> Certified Database Catalog Query -> Recommendation Engine -> Response.
     */
    public AiAssistantResponse processAssistantQuery(AiQueryParseRequest request) {
        long startTime = System.currentTimeMillis();
        validateInput(request);

        // 1. Parse natural language into structured criteria
        ParsedCriteriaResult parseResult = parseQuery(request);
        BookMatchSurveyRequest surveyRequest = parseResult.getSurveyRequest();

        // 2. Query real catalog and execute recommendation engine
        BookMatchRecommendationResponse recommendations = recommendationService.recommendBySurvey(surveyRequest);

        long executionTime = System.currentTimeMillis() - startTime;

        return AiAssistantResponse.builder()
                .originalQuery(request.getQuery())
                .naturalInsight(parseResult.getNaturalInsight())
                .detectedIntent(parseResult.getDetectedIntent())
                .extractedCriteria(surveyRequest)
                .recommendations(recommendations)
                .providerUsed(parseResult.getProvider())
                .fallbackUsed(parseResult.isFallbackUsed())
                .executionTimeMs(executionTime)
                .build();
    }

    private void validateInput(AiQueryParseRequest request) {
        if (request == null || request.getQuery() == null || request.getQuery().trim().isEmpty()) {
            throw new BadRequestException("Câu hỏi tìm sách không được để trống");
        }
        if (request.getQuery().length() > 300) {
            throw new BadRequestException("Câu hỏi tìm sách không được vượt quá 300 ký tự (chống spam và tối ưu chi phí)");
        }
    }
}
