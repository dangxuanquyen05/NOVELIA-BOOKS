package com.novelia.recommendation.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiQueryParseRequest {

    @NotBlank(message = "Câu hỏi hoặc nhu cầu tìm sách không được để trống")
    @Size(max = 300, message = "Độ dài câu hỏi tối đa là 300 ký tự để tối ưu chi phí và bảo mật")
    private String query;
}
