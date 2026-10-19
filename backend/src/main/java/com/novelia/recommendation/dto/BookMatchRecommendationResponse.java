package com.novelia.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookMatchRecommendationResponse {

    private int totalMatches;

    @Builder.Default
    private List<BookMatchItemResponse> items = new ArrayList<>();

    private String appliedFiltersSummary;
}
