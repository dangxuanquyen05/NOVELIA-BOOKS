package com.novelia.book.dto;

import com.novelia.author.dto.AuthorResponse;
import com.novelia.category.dto.CategoryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long id;
    private String title;
    private String slug;
    private String isbn;
    private String coverImage;
    private String publisher;
    private Integer publicationYear;
    private Integer pages;
    private String dimensions;
    private String coverType;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private String shortDescription;
    private String description;
    private String status;
    private Boolean isFeatured;
    private BigDecimal averageRating;
    private Integer reviewCount;
    private Integer stockQuantity;
    private String readingLevel;
    private String readingGoals;
    private String language;
    private Set<AuthorResponse> authors;
    private Set<CategoryResponse> categories;
    private LocalDateTime createdAt;
}
