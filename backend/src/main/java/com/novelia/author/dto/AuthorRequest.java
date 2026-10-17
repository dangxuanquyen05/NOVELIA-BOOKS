package com.novelia.author.dto;

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
public class AuthorRequest {

    @NotBlank(message = "Tên tác giả không được để trống")
    @Size(max = 150, message = "Tên tác giả không được vượt quá 150 ký tự")
    private String name;

    private String slug;

    private String biography;

    private String avatarUrl;

    private String nationality;
}
