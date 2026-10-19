package com.novelia.recommendation.ai.dto;

import com.novelia.recommendation.dto.BookMatchRecommendationResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAssistantResponse {

    private String originalQuery;

    /**
     * Natural language insight explaining how books match this user's mood/context.
     */
    private String naturalInsight;

    /**
     * Human-readable summary of the detected criteria.
     */
    private String detectedIntent;

    /**
     * The verified structured survey request extracted from natural language.
     */
    private BookMatchSurveyRequest extractedCriteria;

    /**
     * Real book recommendations verified by the database & recommendation engine.
     */
    private BookMatchRecommendationResponse recommendations;

    /**
     * Provider used ("gemini", "rule-based-fallback").
     */
    private String providerUsed;

    /**
     * True if fallback parser handled the query (due to missing key, timeout, or error).
     */
    private boolean fallbackUsed;

    /**
     * Execution duration in milliseconds.
     */
    private long executionTimeMs;
}
