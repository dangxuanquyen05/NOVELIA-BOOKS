package com.novelia.author.service;

import com.novelia.author.dto.AuthorRequest;
import com.novelia.author.dto.AuthorResponse;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
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
public class AuthorServiceImpl implements AuthorService {

    private final AuthorRepository authorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AuthorResponse> getAllAuthors() {
        return authorRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorResponse getAuthorById(Long id) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả với ID: " + id));
        return mapToResponse(author);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorResponse getAuthorBySlug(String slug) {
        Author author = authorRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả với slug: " + slug));
        return mapToResponse(author);
    }

    @Override
    @Transactional
    public AuthorResponse createAuthor(AuthorRequest request) {
        String slug = request.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = SlugUtils.toSlug(request.getName());
        }

        if (authorRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        Author author = Author.builder()
                .name(request.getName().trim())
                .slug(slug)
                .biography(request.getBiography())
                .avatarUrl(request.getAvatarUrl())
                .nationality(request.getNationality())
                .build();

        return mapToResponse(authorRepository.save(author));
    }

    @Override
    @Transactional
    public AuthorResponse updateAuthor(Long id, AuthorRequest request) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả với ID: " + id));

        String slug = request.getSlug();
        if (slug != null && !slug.trim().isEmpty() && !slug.equals(author.getSlug())) {
            if (authorRepository.existsBySlug(slug)) {
                throw new BadRequestException("Slug '" + slug + "' đã tồn tại");
            }
            author.setSlug(slug.trim());
        }

        author.setName(request.getName().trim());
        author.setBiography(request.getBiography());
        author.setAvatarUrl(request.getAvatarUrl());
        author.setNationality(request.getNationality());

        return mapToResponse(authorRepository.save(author));
    }

    @Override
    @Transactional
    public void deleteAuthor(Long id) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả với ID: " + id));

        long bookCount = authorRepository.countBooksByAuthorId(id);
        if (bookCount > 0) {
            throw new BadRequestException("Không thể xóa tác giả đang có " + bookCount + " tựa sách liên kết. Vui lòng chuyển hoặc xóa liên kết sách trước.");
        }

        authorRepository.delete(author);
    }

    private AuthorResponse mapToResponse(Author author) {
        return AuthorResponse.builder()
                .id(author.getId())
                .name(author.getName())
                .slug(author.getSlug())
                .biography(author.getBiography())
                .avatarUrl(author.getAvatarUrl())
                .nationality(author.getNationality())
                .build();
    }
}
