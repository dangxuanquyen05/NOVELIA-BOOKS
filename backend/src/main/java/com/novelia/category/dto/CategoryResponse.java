package com.novelia.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private Long parentId;
    private String name;
    private String slug;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private List<CategoryResponse> children;
}
