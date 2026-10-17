package com.novelia.book.dto;

import com.novelia.book.entity.Book;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class BookUpdateRequest {

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

    private Book.CoverType coverType;

    @NotNull(message = "Giá bìa (giá gốc) không được để trống")
    @DecimalMin(value = "0.00", message = "Giá bìa không được âm")
    private BigDecimal originalPrice;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.00", message = "Giá bán không được âm")
    private BigDecimal salePrice;

    private String shortDescription;

    private String description;

    private Book.BookStatus status;

    private Boolean isFeatured;

    @NotEmpty(message = "Sách phải có ít nhất một tác giả")
    private Set<Long> authorIds;

    @NotEmpty(message = "Sách phải thuộc ít nhất một danh mục")
    private Set<Long> categoryIds;

    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer stockQuantity;
}
