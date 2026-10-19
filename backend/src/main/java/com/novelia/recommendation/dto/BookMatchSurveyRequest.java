package com.novelia.recommendation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
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
public class BookMatchSurveyRequest {

    @Size(max = 10, message = "Không được chọn quá 10 mục tiêu đọc")
    @Builder.Default
    private Set<String> readingGoals = new HashSet<>();

    @Size(max = 10, message = "Không được chọn quá 10 thể loại sách")
    @Builder.Default
    private Set<Long> categoryIds = new HashSet<>();

    private String preferredLevel;

    @DecimalMin(value = "0.0", message = "Ngân sách mong muốn không được âm")
    private BigDecimal targetBudget;

    @DecimalMin(value = "0.0", message = "Ngân sách tối đa không được âm")
    private BigDecimal maxBudget;

    @Builder.Default
    private Boolean strictBudget = false;

    private String language;

    @Builder.Default
    private Boolean requireInStock = false;

    @Min(value = 1, message = "Số lượng gợi ý phải từ 1 trở lên")
    @Max(value = 50, message = "Số lượng gợi ý không được vượt quá 50")
    @Builder.Default
    private Integer limit = 10;

    @Builder.Default
    private Set<Long> dislikedBookIds = new HashSet<>();
}
