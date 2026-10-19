package com.novelia.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookMatchItemResponse {

    private Long bookId;
    private String title;
    private String slug;
    private String isbn;
    private String coverImage;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private Integer availableQuantity;
    private String readingLevel;
    private String readingGoals;
    private String language;
    private BigDecimal averageRating;
    private Integer reviewCount;

    @Builder.Default
    private Set<String> authors = new HashSet<>();

    @Builder.Default
    private Set<String> categories = new HashSet<>();

    private Double matchScore;

    @Builder.Default
    private List<String> matchReasons = new ArrayList<>();

    @Builder.Default
    private List<String> missingAttributes = new ArrayList<>();
}
