package com.novelia.author.service;

import com.novelia.author.dto.AuthorRequest;
import com.novelia.author.dto.AuthorResponse;

import java.util.List;

public interface AuthorService {
    List<AuthorResponse> getAllAuthors();
    AuthorResponse getAuthorById(Long id);
    AuthorResponse getAuthorBySlug(String slug);
    AuthorResponse createAuthor(AuthorRequest request);
    AuthorResponse updateAuthor(Long id, AuthorRequest request);
    void deleteAuthor(Long id);
}
