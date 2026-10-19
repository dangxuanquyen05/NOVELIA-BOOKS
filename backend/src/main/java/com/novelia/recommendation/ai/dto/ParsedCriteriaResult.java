package com.novelia.recommendation.ai.dto;

import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedCriteriaResult {

    private BookMatchSurveyRequest surveyRequest;
    private String naturalInsight;
    private String detectedIntent;
    private String provider;
    private boolean fallbackUsed;
}
