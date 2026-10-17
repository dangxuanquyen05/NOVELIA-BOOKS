package com.novelia.author.repository;

import com.novelia.author.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {
    Optional<Author> findBySlug(String slug);
    boolean existsBySlug(String slug);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(b) FROM Book b JOIN b.authors a WHERE a.id = :authorId")
    long countBooksByAuthorId(@org.springframework.data.repository.query.Param("authorId") Long authorId);
}
