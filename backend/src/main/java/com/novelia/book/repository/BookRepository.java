package com.novelia.book.repository;

import com.novelia.book.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
    Optional<Book> findBySlug(String slug);
    Optional<Book> findByIsbn(String isbn);
    boolean existsBySlug(String slug);
    boolean existsByIsbn(String isbn);
    boolean existsByIsbnAndIdNot(String isbn, Long id);

    Page<Book> findByStatus(Book.BookStatus status, Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.status = :status AND b.isFeatured = true")
    Page<Book> findFeaturedBooks(@Param("status") Book.BookStatus status, Pageable pageable);

    @Query("SELECT b FROM Book b JOIN b.categories c WHERE c.slug = :categorySlug AND b.status = :status")
    Page<Book> findByCategorySlug(@Param("categorySlug") String categorySlug, @Param("status") Book.BookStatus status, Pageable pageable);
}
