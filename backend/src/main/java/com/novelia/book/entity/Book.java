package com.novelia.book.entity;

import com.novelia.author.entity.Author;
import com.novelia.category.entity.Category;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(unique = true, length = 20)
    private String isbn;

    @Column(name = "cover_image", length = 500)
    private String coverImage;

    @Column(length = 150)
    private String publisher;

    @Column(name = "publication_year")
    private Integer publicationYear;

    private Integer pages;

    @Column(length = 50)
    private String dimensions;

    @Enumerated(EnumType.STRING)
    @Column(name = "cover_type", length = 20)
    @Builder.Default
    private CoverType coverType = CoverType.PAPERBACK;

    @Column(name = "original_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "sale_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookStatus status = BookStatus.PUBLISHED;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "reading_level", length = 20)
    @Builder.Default
    private String readingLevel = "INTERMEDIATE";

    @Column(name = "reading_goals", length = 255)
    private String readingGoals;

    @Column(name = "language", length = 20)
    @Builder.Default
    private String language = "vi";

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_authors",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    @Builder.Default
    private Set<Author> authors = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_categories",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum CoverType {
        HARDCOVER,
        PAPERBACK
    }

    public enum BookStatus {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }
}
