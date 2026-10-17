package com.novelia.category.service;

import com.novelia.category.dto.CategoryRequest;
import com.novelia.category.dto.CategoryResponse;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.common.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoryTree() {
        List<Category> rootCategories = categoryRepository.findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
        return rootCategories.stream()
                .map(this::mapToTreeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(Boolean activeOnly) {
        List<Category> categories;
        if (Boolean.TRUE.equals(activeOnly)) {
            categories = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        } else {
            categories = categoryRepository.findAll();
        }
        return categories.stream()
                .map(this::mapToFlatResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));
        return mapToTreeResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với slug: " + slug));
        return mapToTreeResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = request.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = SlugUtils.toSlug(request.getName());
        }

        if (categoryRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục cha không tồn tại với ID: " + request.getParentId()));
        }

        Category category = Category.builder()
                .parent(parent)
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return mapToFlatResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BadRequestException("Danh mục không thể là cha của chính nó");
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục cha không tồn tại với ID: " + request.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        String slug = request.getSlug();
        if (slug != null && !slug.trim().isEmpty() && !slug.equals(category.getSlug())) {
            if (categoryRepository.existsBySlug(slug)) {
                throw new BadRequestException("Slug '" + slug + "' đã tồn tại");
            }
            category.setSlug(slug.trim());
        }

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        return mapToFlatResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        long bookCount = categoryRepository.countBooksByCategoryId(id);
        if (bookCount > 0) {
            throw new BadRequestException("Không thể xóa danh mục đang có " + bookCount + " tựa sách liên kết. Vui lòng chuyển hoặc xóa liên kết sách trước.");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse mapToFlatResponse(Category cat) {
        return CategoryResponse.builder()
                .id(cat.getId())
                .parentId(cat.getParent() != null ? cat.getParent().getId() : null)
                .name(cat.getName())
                .slug(cat.getSlug())
                .description(cat.getDescription())
                .displayOrder(cat.getDisplayOrder())
                .isActive(cat.getIsActive())
                .build();
    }

    private CategoryResponse mapToTreeResponse(Category cat) {
        List<CategoryResponse> children = null;
        if (cat.getSubCategories() != null && !cat.getSubCategories().isEmpty()) {
            children = cat.getSubCategories().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                    .map(this::mapToTreeResponse)
                    .collect(Collectors.toList());
        }

        return CategoryResponse.builder()
                .id(cat.getId())
                .parentId(cat.getParent() != null ? cat.getParent().getId() : null)
                .name(cat.getName())
                .slug(cat.getSlug())
                .description(cat.getDescription())
                .displayOrder(cat.getDisplayOrder())
                .isActive(cat.getIsActive())
                .children(children)
                .build();
    }
}
