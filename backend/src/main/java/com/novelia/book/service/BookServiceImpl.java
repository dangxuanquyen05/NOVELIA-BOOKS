package com.novelia.book.service;

import com.novelia.author.dto.AuthorResponse;
import com.novelia.author.entity.Author;
import com.novelia.author.repository.AuthorRepository;
import com.novelia.book.dto.BookCreateRequest;
import com.novelia.book.dto.BookFilterParams;
import com.novelia.book.dto.BookResponse;
import com.novelia.book.dto.BookUpdateRequest;
import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.book.specification.BookSpecification;
import com.novelia.category.dto.CategoryResponse;
import com.novelia.category.entity.Category;
import com.novelia.category.repository.CategoryRepository;
import com.novelia.common.dto.PageResponse;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.common.util.SlugUtils;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final com.novelia.order.repository.OrderItemRepository orderItemRepository;
    private final com.novelia.audit.service.AuditLogService auditLogService;

    public BookServiceImpl(
            BookRepository bookRepository,
            AuthorRepository authorRepository,
            CategoryRepository categoryRepository,
            InventoryRepository inventoryRepository,
            com.novelia.order.repository.OrderItemRepository orderItemRepository,
            com.novelia.audit.service.AuditLogService auditLogService) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookResponse> getBooks(BookFilterParams params) {
        if (params == null) {
            params = new BookFilterParams();
        }

        int page = params.getPage() != null && params.getPage() >= 0 ? params.getPage() : 0;
        int size = params.getSize() != null && params.getSize() > 0 ? params.getSize() : 12;

        Sort sort = parseSort(params.getSortBy());
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Book> spec = BookSpecification.buildSpecification(params);
        Page<Book> bookPage = bookRepository.findAll(spec, pageable);

        // Fetch inventories for the retrieved books to get available stock
        List<Long> bookIds = bookPage.getContent().stream().map(Book::getId).toList();
        Map<Long, Integer> stockMap = new HashMap<>();
        if (!bookIds.isEmpty()) {
            List<Inventory> inventories = inventoryRepository.findByBookIdIn(bookIds);
            for (Inventory inv : inventories) {
                stockMap.put(inv.getBook().getId(), inv.getAvailableQuantity());
            }
        }

        List<BookResponse> bookResponses = bookPage.getContent().stream()
                .map(book -> mapToResponse(book, stockMap.getOrDefault(book.getId(), 0)))
                .collect(Collectors.toList());

        return PageResponse.<BookResponse>builder()
                .content(bookResponses)
                .pageNumber(bookPage.getNumber())
                .pageSize(bookPage.getSize())
                .totalElements(bookPage.getTotalElements())
                .totalPages(bookPage.getTotalPages())
                .isFirst(bookPage.isFirst())
                .isLast(bookPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BookResponse getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));
        return getBookResponseWithStock(book);
    }

    @Override
    @Transactional(readOnly = true)
    public BookResponse getBookBySlug(String slug) {
        Book book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với slug: " + slug));
        return getBookResponseWithStock(book);
    }

    @Override
    @Transactional(readOnly = true)
    public BookResponse getBookByIdOrSlug(String idOrSlug) {
        try {
            Long id = Long.parseLong(idOrSlug);
            return getBookById(id);
        } catch (NumberFormatException e) {
            return getBookBySlug(idOrSlug);
        }
    }

    @Override
    @Transactional
    public BookResponse createBook(BookCreateRequest request) {
        // Validate non-negative prices and stock
        if (request.getOriginalPrice().compareTo(BigDecimal.ZERO) < 0 || request.getSalePrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Giá bìa và giá bán không được là số âm");
        }
        if (request.getInitialStock() != null && request.getInitialStock() < 0) {
            throw new BadRequestException("Số lượng tồn kho ban đầu không được âm");
        }

        // Validate salePrice <= originalPrice
        if (request.getSalePrice().compareTo(request.getOriginalPrice()) > 0) {
            throw new BadRequestException("Giá bán không được lớn hơn giá bìa (giá gốc)");
        }

        // Clean and validate unique ISBN
        String cleanIsbn = request.getIsbn().replaceAll("[\\s-]+", "").toUpperCase();
        if (bookRepository.existsByIsbn(cleanIsbn)) {
            throw new BadRequestException("Mã ISBN '" + request.getIsbn() + "' đã tồn tại trong hệ thống");
        }

        // Generate or validate slug
        String slug = request.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = SlugUtils.toSlug(request.getTitle());
        }
        if (bookRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        // Fetch Authors
        Set<Author> authors = new HashSet<>(authorRepository.findAllById(request.getAuthorIds()));
        if (authors.isEmpty()) {
            throw new BadRequestException("Không tìm thấy tác giả hợp lệ với danh sách ID cung cấp");
        }

        // Fetch Categories
        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(request.getCategoryIds()));
        if (categories.isEmpty()) {
            throw new BadRequestException("Không tìm thấy danh mục hợp lệ với danh sách ID cung cấp");
        }

        Book.BookStatus status = request.getStatus() != null ? request.getStatus() : Book.BookStatus.PUBLISHED;

        Book book = Book.builder()
                .title(request.getTitle().trim())
                .slug(slug)
                .isbn(cleanIsbn)
                .coverImage(request.getCoverImage())
                .publisher(request.getPublisher())
                .publicationYear(request.getPublicationYear())
                .pages(request.getPages())
                .dimensions(request.getDimensions())
                .coverType(request.getCoverType() != null ? request.getCoverType() : Book.CoverType.PAPERBACK)
                .originalPrice(request.getOriginalPrice())
                .salePrice(request.getSalePrice())
                .shortDescription(request.getShortDescription())
                .description(request.getDescription())
                .status(status)
                .isFeatured(Boolean.TRUE.equals(request.getIsFeatured()))
                .averageRating(BigDecimal.ZERO)
                .reviewCount(0)
                .authors(authors)
                .categories(categories)
                .build();

        Book savedBook = bookRepository.save(book);

        // Create initial inventory
        int initialStock = request.getInitialStock() != null ? request.getInitialStock() : 0;
        Inventory inventory = Inventory.builder()
                .book(savedBook)
                .quantity(initialStock)
                .reservedQuantity(0)
                .lowStockThreshold(5)
                .build();
        inventoryRepository.save(inventory);

        auditLogService.log(getCurrentUserEmail(), "BOOK_CREATE", "BOOK", savedBook.getId().toString(),
                "Thêm tựa sách mới: " + savedBook.getTitle(),
                "ISBN: " + savedBook.getIsbn() + ", Giá bìa: " + savedBook.getOriginalPrice() + ", Giá bán: " + savedBook.getSalePrice() + ", Tồn ban đầu: " + initialStock);

        return mapToResponse(savedBook, initialStock);
    }

    @Override
    @Transactional
    public BookResponse updateBook(Long id, BookUpdateRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));

        // Validate non-negative prices and stock
        if (request.getOriginalPrice().compareTo(BigDecimal.ZERO) < 0 || request.getSalePrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Giá bìa và giá bán không được là số âm");
        }
        if (request.getStockQuantity() != null && request.getStockQuantity() < 0) {
            throw new BadRequestException("Số lượng tồn kho không được âm");
        }

        // Validate salePrice <= originalPrice
        if (request.getSalePrice().compareTo(request.getOriginalPrice()) > 0) {
            throw new BadRequestException("Giá bán không được lớn hơn giá bìa (giá gốc)");
        }

        // Clean and validate ISBN if changed
        String cleanIsbn = request.getIsbn().replaceAll("[\\s-]+", "").toUpperCase();
        if (!cleanIsbn.equalsIgnoreCase(book.getIsbn())) {
            if (bookRepository.existsByIsbnAndIdNot(cleanIsbn, id)) {
                throw new BadRequestException("Mã ISBN '" + request.getIsbn() + "' đã tồn tại ở sách khác");
            }
            book.setIsbn(cleanIsbn);
        }

        // Validate Slug if changed
        String slug = request.getSlug();
        if (slug != null && !slug.trim().isEmpty() && !slug.equals(book.getSlug())) {
            if (bookRepository.existsBySlug(slug)) {
                throw new BadRequestException("Slug '" + slug + "' đã tồn tại");
            }
            book.setSlug(slug.trim());
        }

        // Update Authors
        Set<Author> authors = new HashSet<>(authorRepository.findAllById(request.getAuthorIds()));
        if (authors.isEmpty()) {
            throw new BadRequestException("Không tìm thấy tác giả hợp lệ với danh sách ID cung cấp");
        }
        book.setAuthors(authors);

        // Update Categories
        Set<Category> categories = new HashSet<>(categoryRepository.findAllById(request.getCategoryIds()));
        if (categories.isEmpty()) {
            throw new BadRequestException("Không tìm thấy danh mục hợp lệ với danh sách ID cung cấp");
        }
        book.setCategories(categories);

        // Update details
        book.setTitle(request.getTitle().trim());
        book.setCoverImage(request.getCoverImage());
        book.setPublisher(request.getPublisher());
        book.setPublicationYear(request.getPublicationYear());
        book.setPages(request.getPages());
        book.setDimensions(request.getDimensions());
        if (request.getCoverType() != null) {
            book.setCoverType(request.getCoverType());
        }
        book.setOriginalPrice(request.getOriginalPrice());
        book.setSalePrice(request.getSalePrice());
        book.setShortDescription(request.getShortDescription());
        book.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            book.setStatus(request.getStatus());
        }
        if (request.getIsFeatured() != null) {
            book.setIsFeatured(request.getIsFeatured());
        }

        Book updatedBook = bookRepository.save(book);

        // Update Inventory quantity if specified
        int currentStock = 0;
        Optional<Inventory> invOpt = inventoryRepository.findByBookId(updatedBook.getId());
        if (invOpt.isPresent()) {
            Inventory inv = invOpt.get();
            if (request.getStockQuantity() != null) {
                inv.setQuantity(request.getStockQuantity());
                inventoryRepository.save(inv);
            }
            currentStock = inv.getAvailableQuantity();
        } else if (request.getStockQuantity() != null) {
            Inventory newInv = Inventory.builder()
                    .book(updatedBook)
                    .quantity(request.getStockQuantity())
                    .reservedQuantity(0)
                    .lowStockThreshold(5)
                    .build();
            inventoryRepository.save(newInv);
            currentStock = request.getStockQuantity();
        }

        auditLogService.log(getCurrentUserEmail(), "BOOK_UPDATE", "BOOK", updatedBook.getId().toString(),
                "Cập nhật thông tin sách: " + updatedBook.getTitle(),
                "Giá bán: " + updatedBook.getSalePrice() + ", Tồn kho: " + currentStock + ", Trạng thái: " + updatedBook.getStatus());

        return mapToResponse(updatedBook, currentStock);
    }

    @Override
    @Transactional
    public BookResponse updateBookStatus(Long id, Book.BookStatus status) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));
        book.setStatus(status);
        Book saved = bookRepository.save(book);

        auditLogService.log(getCurrentUserEmail(), "BOOK_STATUS_UPDATE", "BOOK", saved.getId().toString(),
                "Cập nhật trạng thái sách: " + saved.getTitle() + " -> " + status,
                "Trạng thái mới: " + status);

        return getBookResponseWithStock(saved);
    }

    @Override
    @Transactional
    public String deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));

        boolean hasOrders = orderItemRepository.existsByBookId(id);
        if (hasOrders) {
            // Không xóa cứng sách đang được tham chiếu trong đơn hàng; chuyển sang trạng thái ARCHIVED để bảo toàn lịch sử giao dịch
            book.setStatus(Book.BookStatus.ARCHIVED);
            bookRepository.save(book);
            auditLogService.log(getCurrentUserEmail(), "BOOK_DELETE", "BOOK", id.toString(),
                    "Ngừng kinh doanh / lưu trữ sách: " + book.getTitle(),
                    "Chuyển sang ARCHIVED do đã có đơn hàng tham chiếu");
            log.info("Sách ID {} ('{}') đã được đặt trong đơn hàng -> Chuyển sang lưu trữ (ngừng kinh doanh).", id, book.getTitle());
            return "Sách đã phát sinh đơn hàng nên không thể xóa vĩnh viễn. Hệ thống đã tự động chuyển sang trạng thái Lưu trữ (ngừng kinh doanh).";
        } else {
            // Sách chưa có đơn hàng -> Có thể xóa an toàn
            inventoryRepository.findByBookId(id).ifPresent(inventoryRepository::delete);
            bookRepository.delete(book);
            auditLogService.log(getCurrentUserEmail(), "BOOK_DELETE", "BOOK", id.toString(),
                    "Xóa vĩnh viễn sách: " + book.getTitle(),
                    "Đã xóa hoàn toàn khỏi cơ sở dữ liệu");
            log.info("Sách ID {} ('{}') chưa có đơn hàng -> Đã xóa hoàn toàn khỏi hệ thống.", id, book.getTitle());
            return "Đã xóa vĩnh viễn tựa sách khỏi hệ thống.";
        }
    }

    private String getCurrentUserEmail() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) ? auth.getName() : "SYSTEM";
    }

    private BookResponse getBookResponseWithStock(Book book) {
        int stock = inventoryRepository.findByBookId(book.getId())
                .map(Inventory::getAvailableQuantity)
                .orElse(0);
        return mapToResponse(book, stock);
    }

    private BookResponse mapToResponse(Book book, int stockQuantity) {
        Set<AuthorResponse> authorResponses = book.getAuthors().stream()
                .map(a -> AuthorResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .slug(a.getSlug())
                        .biography(a.getBiography())
                        .avatarUrl(a.getAvatarUrl())
                        .nationality(a.getNationality())
                        .build())
                .collect(Collectors.toSet());

        Set<CategoryResponse> categoryResponses = book.getCategories().stream()
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .parentId(c.getParent() != null ? c.getParent().getId() : null)
                        .name(c.getName())
                        .slug(c.getSlug())
                        .description(c.getDescription())
                        .displayOrder(c.getDisplayOrder())
                        .isActive(c.getIsActive())
                        .build())
                .collect(Collectors.toSet());

        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .slug(book.getSlug())
                .isbn(book.getIsbn())
                .coverImage(book.getCoverImage())
                .publisher(book.getPublisher())
                .publicationYear(book.getPublicationYear())
                .pages(book.getPages())
                .dimensions(book.getDimensions())
                .coverType(book.getCoverType() != null ? book.getCoverType().name() : null)
                .originalPrice(book.getOriginalPrice())
                .salePrice(book.getSalePrice())
                .shortDescription(book.getShortDescription())
                .description(book.getDescription())
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .isFeatured(book.getIsFeatured())
                .averageRating(book.getAverageRating())
                .reviewCount(book.getReviewCount())
                .stockQuantity(stockQuantity)
                .readingLevel(book.getReadingLevel())
                .readingGoals(book.getReadingGoals())
                .language(book.getLanguage())
                .authors(authorResponses)
                .categories(categoryResponses)
                .createdAt(book.getCreatedAt())
                .build();
    }

    private Sort parseSort(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sortBy.toLowerCase().trim()) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "salePrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "salePrice");
            case "rating" -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "title", "title_asc" -> Sort.by(Sort.Direction.ASC, "title");
            case "title_desc" -> Sort.by(Sort.Direction.DESC, "title");
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
