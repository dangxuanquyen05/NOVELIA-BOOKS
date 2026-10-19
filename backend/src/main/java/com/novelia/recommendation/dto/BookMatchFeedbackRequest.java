package com.novelia.recommendation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookMatchFeedbackRequest {

    @NotNull(message = "ID sách không được để trống")
    private Long bookId;

    @NotBlank(message = "Loại phản hồi không được để trống")
    @Pattern(regexp = "^(HELPFUL|NOT_RELEVANT)$", message = "Loại phản hồi phải là HELPFUL hoặc NOT_RELEVANT")
    private String feedbackType;
}
