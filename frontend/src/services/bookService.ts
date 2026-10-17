import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { Book, Category, Author, PageResponse, BookFilterParams } from '../types/book';

export const bookService = {
  // Lấy danh sách sách có phân trang, lọc và sắp xếp
  getBooks: async (params?: BookFilterParams): Promise<ApiResponse<PageResponse<Book>>> => {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
      if (params.categoryId) cleanParams.categoryId = params.categoryId;
      if (params.categorySlug?.trim()) cleanParams.categorySlug = params.categorySlug.trim();
      if (params.authorId) cleanParams.authorId = params.authorId;
      if (params.minPrice !== undefined && params.minPrice !== null) cleanParams.minPrice = params.minPrice;
      if (params.maxPrice !== undefined && params.maxPrice !== null) cleanParams.maxPrice = params.maxPrice;
      if (params.isFeatured !== undefined && params.isFeatured !== null) cleanParams.isFeatured = params.isFeatured;
      if (params.sortBy?.trim()) cleanParams.sortBy = params.sortBy.trim();
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.size !== undefined) cleanParams.size = params.size;
    }

    const response = await apiClient.get<ApiResponse<PageResponse<Book>>>('/books', {
      params: cleanParams,
    });
    return response.data;
  },

  // Tìm kiếm sách nhanh theo từ khóa
  searchBooks: async (keyword: string, page: number = 0, size: number = 5): Promise<ApiResponse<PageResponse<Book>>> => {
    return bookService.getBooks({ keyword, page, size });
  },

  // Lấy chi tiết sách theo slug hoặc ID
  getBookBySlugOrId: async (slugOrId: string | number): Promise<ApiResponse<Book>> => {
    const response = await apiClient.get<ApiResponse<Book>>(`/books/${slugOrId}`);
    return response.data;
  },

  // Lấy danh sách danh mục (hỗ trợ cây phân cấp)
  getCategories: async (tree: boolean = false): Promise<ApiResponse<Category[]>> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: { tree, activeOnly: true },
    });
    return response.data;
  },

  // Lấy danh sách tác giả
  getAuthors: async (): Promise<ApiResponse<Author[]>> => {
    const response = await apiClient.get<ApiResponse<Author[]>>('/authors');
    return response.data;
  },
};
