package com.novelia.review.dto;

import com.novelia.review.entity.Review;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerateReviewRequest {

    @NotNull(message = "Hành động kiểm duyệt không được để trống")
    private Review.ReviewStatus status; // APPROVED or REJECTED

    @Size(max = 255, message = "Lý do từ chối không được quá 255 ký tự")
    private String rejectionReason;
}
