package com.novelia.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferenceResponse {

    @Builder.Default
    private Set<String> readingGoals = new HashSet<>();

    @Builder.Default
    private Set<Long> categoryIds = new HashSet<>();

    private String preferredLevel;

    private BigDecimal targetBudget;

    private LocalDateTime updatedAt;
}
