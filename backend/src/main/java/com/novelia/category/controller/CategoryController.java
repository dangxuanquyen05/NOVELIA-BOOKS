package com.novelia.category.controller;

import com.novelia.category.dto.CategoryRequest;
import com.novelia.category.dto.CategoryResponse;
import com.novelia.category.service.CategoryService;
import com.novelia.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            @RequestParam(required = false, defaultValue = "false") boolean tree,
            @RequestParam(required = false, defaultValue = "true") boolean activeOnly) {
        List<CategoryResponse> categories = tree
                ? categoryService.getCategoryTree()
                : categoryService.getAllCategories(activeOnly);
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/{slugOrId}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategory(@PathVariable String slugOrId) {
        CategoryResponse category;
        try {
            Long id = Long.parseLong(slugOrId);
            category = categoryService.getCategoryById(id);
        } catch (NumberFormatException e) {
            category = categoryService.getCategoryBySlug(slugOrId);
        }
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo danh mục mới thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công", null));
    }
}
