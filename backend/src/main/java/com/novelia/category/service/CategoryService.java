package com.novelia.category.service;

import com.novelia.category.dto.CategoryRequest;
import com.novelia.category.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getCategoryTree();
    List<CategoryResponse> getAllCategories(Boolean activeOnly);
    CategoryResponse getCategoryById(Long id);
    CategoryResponse getCategoryBySlug(String slug);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}
