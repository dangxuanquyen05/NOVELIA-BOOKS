package com.novelia.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookMatchContext {
    private Long targetBookId;
    @Builder.Default
    private Set<Long> targetCategoryIds = new HashSet<>();
    @Builder.Default
    private Set<Long> targetAuthorIds = new HashSet<>();
    private BigDecimal targetPrice;

    @Builder.Default
    private Set<Long> preferredCategoryIds = new HashSet<>();
    @Builder.Default
    private Set<Long> preferredAuthorIds = new HashSet<>();
    @Builder.Default
    private Set<Long> excludedBookIds = new HashSet<>();
}
