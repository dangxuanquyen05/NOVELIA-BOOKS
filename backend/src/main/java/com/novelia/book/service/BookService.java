package com.novelia.book.service;

import com.novelia.book.dto.BookCreateRequest;
import com.novelia.book.dto.BookFilterParams;
import com.novelia.book.dto.BookResponse;
import com.novelia.book.dto.BookUpdateRequest;
import com.novelia.book.entity.Book;
import com.novelia.common.dto.PageResponse;

public interface BookService {
    PageResponse<BookResponse> getBooks(BookFilterParams params);
    BookResponse getBookById(Long id);
    BookResponse getBookBySlug(String slug);
    BookResponse getBookByIdOrSlug(String idOrSlug);
    BookResponse createBook(BookCreateRequest request);
    BookResponse updateBook(Long id, BookUpdateRequest request);
    BookResponse updateBookStatus(Long id, Book.BookStatus status);
    String deleteBook(Long id);
}
