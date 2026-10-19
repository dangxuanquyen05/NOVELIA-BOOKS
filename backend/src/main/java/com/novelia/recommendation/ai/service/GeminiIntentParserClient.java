package com.novelia.recommendation.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.category.entity.Category;
import com.novelia.recommendation.ai.config.AiProperties;
import com.novelia.recommendation.ai.dto.ParsedCriteriaResult;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Optional Google Gemini API Client for Natural Language Query Understanding.
 * Transforms user natural phrasing into structured BookMatch survey criteria.
 * Does NOT generate hallucinated products or modify prices/inventory.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiIntentParserClient {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(3000))
            .build();

    // Simple thread-safe rate limiter counter
    private final AtomicInteger requestCounter = new AtomicInteger(0);
    private volatile long currentMinuteTimestamp = System.currentTimeMillis() / 60000;

    /**
     * Parse natural language using Gemini API.
     * Returns null if disabled, credentials missing, rate limit hit, or on error/timeout,
     * allowing immediate seamless fallback to RuleBasedIntentParser.
     */
    public ParsedCriteriaResult parseWithGemini(String userQuery, List<Category> availableCategories) {
        if (!aiProperties.isEnabled() || !aiProperties.hasValidCredentials()) {
            log.debug("Gemini AI is disabled or credentials are not configured. Bypassing to fallback.");
            return null;
        }

        // Rate limit check
        if (!checkRateLimit()) {
            log.warn("Gemini AI rate limit exceeded (max {} req/min). Falling back to rule-based engine.",
                    aiProperties.getRateLimitPerMinute());
            return null;
        }

        // Prompt Injection Sanitization
        String sanitizedQuery = sanitizePrompt(userQuery);

        try {
            String categoryContext = availableCategories != null ? availableCategories.stream()
                    .map(c -> String.format("{\"id\": %d, \"name\": \"%s\"}", c.getId(), c.getName()))
                    .collect(Collectors.joining(", ")) : "";

            String systemPrompt = """
                You are a BookMatch Intent Extraction Assistant for the Vietnamese bookstore NOVELIA BOOKS.
                Task: Analyze the customer's natural language request and extract structured book search parameters.
                Strict Rules:
                1. DO NOT invent book titles, ISBNs, prices, or inventory.
                2. Map the user's intent only to standard reading goals: [MINDSET, HEALING, REFLECTION, PHILOSOPHY, CAREER_SKILLS, ENTERTAINMENT, DETECTIVE, CLASSIC].
                3. Map to category IDs from this real catalog list: [%s].
                4. Set reading level to one of: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].
                5. Extract numeric budget in VND (e.g. 150k -> 150000). Set strictBudget = true if user said 'dưới' or 'không quá'.
                6. Generate a short natural Vietnamese insight (max 2 sentences) describing why this selection fits their mood.
                7. Output strictly valid JSON matching this structure:
                {
                   "goals": ["MINDSET"],
                   "categoryIds": [1, 2],
                   "level": "BEGINNER",
                   "maxBudget": 200000,
                   "targetBudget": 150000,
                   "strictBudget": true,
                   "requireInStock": false,
                   "naturalInsight": "Gợi ý sách phù hợp..."
                }
                """.formatted(categoryContext);

            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(
                                    Map.of("text", systemPrompt + "\n\nUser request: <user_book_request>" + sanitizedQuery + "</user_book_request>")
                            ))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.1,
                            "maxOutputTokens", 500,
                            "responseMimeType", "application/json"
                    )
            ));

            String fullUrl = String.format("%s/%s:generateContent?key=%s",
                    aiProperties.getEndpoint(), aiProperties.getModel(), aiProperties.getApiKey());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fullUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofMillis(aiProperties.getTimeoutMs()))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Gemini API returned status {}: {}. Triggering fallback.", response.statusCode(), response.body());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.at("/candidates/0/content/parts/0/text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                log.warn("Gemini response missing text candidate. Triggering fallback.");
                return null;
            }

            String jsonText = textNode.asText().trim();
            // Clean markdown code blocks if any
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
            }
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3);
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }

            JsonNode parsed = objectMapper.readTree(jsonText.trim());

            Set<String> goals = new HashSet<>();
            if (parsed.has("goals") && parsed.get("goals").isArray()) {
                for (JsonNode g : parsed.get("goals")) {
                    goals.add(g.asText().toUpperCase());
                }
            }

            Set<Long> categoryIds = new HashSet<>();
            if (parsed.has("categoryIds") && parsed.get("categoryIds").isArray()) {
                for (JsonNode c : parsed.get("categoryIds")) {
                    categoryIds.add(c.asLong());
                }
            }

            String level = parsed.has("level") ? parsed.get("level").asText() : "INTERMEDIATE";
            BigDecimal maxBudget = parsed.has("maxBudget") && !parsed.get("maxBudget").isNull()
                    ? BigDecimal.valueOf(parsed.get("maxBudget").asDouble()) : null;
            BigDecimal targetBudget = parsed.has("targetBudget") && !parsed.get("targetBudget").isNull()
                    ? BigDecimal.valueOf(parsed.get("targetBudget").asDouble()) : null;
            boolean strictBudget = parsed.has("strictBudget") && parsed.get("strictBudget").asBoolean();
            boolean requireInStock = parsed.has("requireInStock") && parsed.get("requireInStock").asBoolean();
            String naturalInsight = parsed.has("naturalInsight") ? parsed.get("naturalInsight").asText()
                    : "Gợi ý được phân tích bởi trợ lý AI thông minh kết hợp với kho sách thật.";

            BookMatchSurveyRequest surveyRequest = BookMatchSurveyRequest.builder()
                    .readingGoals(goals)
                    .categoryIds(categoryIds)
                    .preferredLevel(level)
                    .targetBudget(targetBudget)
                    .maxBudget(maxBudget)
                    .strictBudget(strictBudget)
                    .requireInStock(requireInStock)
                    .language("vi")
                    .limit(8)
                    .build();

            log.info("Gemini AI successfully parsed query into structured criteria: goals={}, cats={}, maxBudget={}",
                    goals, categoryIds, maxBudget);

            return ParsedCriteriaResult.builder()
                    .surveyRequest(surveyRequest)
                    .naturalInsight(naturalInsight)
                    .detectedIntent("Trợ lý trí tuệ nhân tạo (Google Gemini API)")
                    .provider("gemini")
                    .fallbackUsed(false)
                    .build();

        } catch (Exception e) {
            log.warn("Exception during Gemini AI query parsing: {}. Triggering fallback gracefully.", e.getMessage());
            return null;
        }
    }

    private boolean checkRateLimit() {
        long currentMinute = System.currentTimeMillis() / 60000;
        if (currentMinute != currentMinuteTimestamp) {
            currentMinuteTimestamp = currentMinute;
            requestCounter.set(0);
        }
        return requestCounter.incrementAndGet() <= aiProperties.getRateLimitPerMinute();
    }

    private String sanitizePrompt(String input) {
        if (input == null) return "";
        // Strip out prompt injection patterns
        return input.replaceAll("(?i)(ignore previous instructions|system prompt|override system|delete from|drop table)", "[FILTERED]")
                .replace("```", "")
                .trim();
    }
}
