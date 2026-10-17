package com.novelia.author.controller;

import com.novelia.author.dto.AuthorRequest;
import com.novelia.author.dto.AuthorResponse;
import com.novelia.author.service.AuthorService;
import com.novelia.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {

    private final AuthorService authorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuthorResponse>>> getAllAuthors() {
        List<AuthorResponse> authors = authorService.getAllAuthors();
        return ResponseEntity.ok(ApiResponse.success(authors));
    }

    @GetMapping("/{slugOrId}")
    public ResponseEntity<ApiResponse<AuthorResponse>> getAuthor(@PathVariable String slugOrId) {
        AuthorResponse author;
        try {
            Long id = Long.parseLong(slugOrId);
            author = authorService.getAuthorById(id);
        } catch (NumberFormatException e) {
            author = authorService.getAuthorBySlug(slugOrId);
        }
        return ResponseEntity.ok(ApiResponse.success(author));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<AuthorResponse>> createAuthor(@Valid @RequestBody AuthorRequest request) {
        AuthorResponse response = authorService.createAuthor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tác giả mới thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<AuthorResponse>> updateAuthor(
            @PathVariable Long id,
            @Valid @RequestBody AuthorRequest request) {
        AuthorResponse response = authorService.updateAuthor(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tác giả thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAuthor(@PathVariable Long id) {
        authorService.deleteAuthor(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tác giả thành công", null));
    }
}
