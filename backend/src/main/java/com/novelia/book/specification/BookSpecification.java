package com.novelia.book.specification;

import com.novelia.author.entity.Author;
import com.novelia.book.dto.BookFilterParams;
import com.novelia.book.entity.Book;
import com.novelia.category.entity.Category;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class BookSpecification {

    public static Specification<Book> buildSpecification(BookFilterParams params) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Avoid duplicate rows when joining collection tables
            if (query != null && Long.class != query.getResultType()) {
                query.distinct(true);
            }

            // Keyword filter (title or isbn)
            if (params.getKeyword() != null && !params.getKeyword().trim().isEmpty()) {
                String keywordPattern = "%" + params.getKeyword().trim().toLowerCase() + "%";
                Predicate titleMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), keywordPattern);
                Predicate isbnMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("isbn")), keywordPattern);
                predicates.add(criteriaBuilder.or(titleMatch, isbnMatch));
            }

            // Category ID filter
            if (params.getCategoryId() != null) {
                Join<Book, Category> categoryJoin = root.join("categories", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(categoryJoin.get("id"), params.getCategoryId()));
            } else if (params.getCategorySlug() != null && !params.getCategorySlug().trim().isEmpty()) {
                Join<Book, Category> categoryJoin = root.join("categories", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(categoryJoin.get("slug"), params.getCategorySlug().trim()));
            }

            // Author ID filter
            if (params.getAuthorId() != null) {
                Join<Book, Author> authorJoin = root.join("authors", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(authorJoin.get("id"), params.getAuthorId()));
            }

            // Price range filter (on salePrice)
            if (params.getMinPrice() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("salePrice"), params.getMinPrice()));
            }
            if (params.getMaxPrice() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("salePrice"), params.getMaxPrice()));
            }

            // Status filter
            if (params.getStatus() != null && !params.getStatus().trim().isEmpty()) {
                try {
                    Book.BookStatus statusEnum = Book.BookStatus.valueOf(params.getStatus().trim().toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException ignored) {
                    // Ignore invalid status enum or let it return nothing if invalid
                }
            }

            // Featured filter
            if (params.getIsFeatured() != null) {
                predicates.add(criteriaBuilder.equal(root.get("isFeatured"), params.getIsFeatured()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
