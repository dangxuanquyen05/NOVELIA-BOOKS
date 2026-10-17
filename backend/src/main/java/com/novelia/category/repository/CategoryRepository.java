package com.novelia.category.repository;

import com.novelia.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    List<Category> findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
    List<Category> findByIsActiveTrueOrderByDisplayOrderAsc();
    boolean existsBySlug(String slug);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(b) FROM Book b JOIN b.categories c WHERE c.id = :categoryId")
    long countBooksByCategoryId(@org.springframework.data.repository.query.Param("categoryId") Long categoryId);
}
