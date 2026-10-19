package com.novelia.recommendation.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "novelia.ai")
public class AiProperties {

    /**
     * Flag declaring whether remote AI is active.
     * Defaults to false if no credentials exist.
     */
    private boolean enabled = false;

    /**
     * AI Provider (gemini, openai)
     */
    private String provider = "gemini";

    /**
     * Secret API Key loaded strictly from environment variable.
     */
    private String apiKey;

    /**
     * Model name (e.g. gemini-1.5-flash)
     */
    private String model = "gemini-1.5-flash";

    /**
     * Base endpoint
     */
    private String endpoint = "https://generativelanguage.googleapis.com/v1beta/models";

    /**
     * Hard timeout for external AI calls in milliseconds.
     */
    private int timeoutMs = 4000;

    /**
     * Max requests per minute across the application.
     */
    private int rateLimitPerMinute = 30;

    /**
     * Max daily cost estimate in USD before throttling.
     */
    private double dailyCostCapUsd = 1.0;

    /**
     * Automatic fallback to offline rule-based parser on errors/timeouts.
     */
    private boolean fallbackEnabled = true;

    /**
     * Check if AI has valid credentials configured.
     */
    public boolean hasValidCredentials() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.contains("PLACEHOLDER");
    }
}
