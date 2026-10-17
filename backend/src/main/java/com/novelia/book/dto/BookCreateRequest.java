package com.novelia.book.dto;

import com.novelia.book.entity.Book;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookCreateRequest {

    @NotBlank(message = "Tiêu đề sách không được để trống")
    @Size(max = 255, message = "Tiêu đề sách không được vượt quá 255 ký tự")
    private String title;

    private String slug;

    @NotBlank(message = "Mã ISBN không được để trống")
    @Pattern(regexp = "^(97(8|9))?\\d{9}(\\d|X)$", message = "Mã ISBN phải đúng định dạng chuẩn 10 hoặc 13 chữ số")
    private String isbn;

    private String coverImage;

    private String publisher;

    private Integer publicationYear;

    @Min(value = 1, message = "Số trang sách phải lớn hơn 0")
    private Integer pages;

    private String dimensions;

    @Builder.Default
    private Book.CoverType coverType = Book.CoverType.PAPERBACK;

    @NotNull(message = "Giá bìa (giá gốc) không được để trống")
    @DecimalMin(value = "0.00", message = "Giá bìa không được âm")
    private BigDecimal originalPrice;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.00", message = "Giá bán không được âm")
    private BigDecimal salePrice;

    private String shortDescription;

    private String description;

    @Builder.Default
    private Book.BookStatus status = Book.BookStatus.PUBLISHED;

    @Builder.Default
    private Boolean isFeatured = false;

    @NotEmpty(message = "Sách phải có ít nhất một tác giả")
    private Set<Long> authorIds;

    @NotEmpty(message = "Sách phải thuộc ít nhất một danh mục")
    private Set<Long> categoryIds;

    @Min(value = 0, message = "Số lượng tồn kho ban đầu không được âm")
    @Builder.Default
    private Integer initialStock = 0;
}
