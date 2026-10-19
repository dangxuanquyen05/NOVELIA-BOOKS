package com.novelia.recommendation.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiStatusResponse {

    private boolean aiEnabled;
    private boolean credentialsConfigured;
    private String provider;
    private String model;
    private boolean fallbackAvailable;
    private int rateLimitPerMinute;
    private String statusMessage;
}
