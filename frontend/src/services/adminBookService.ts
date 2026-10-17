import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { Book } from '../types/book';

export interface BookCreateRequest {
  title: string;
  slug?: string;
  isbn: string;
  coverImage?: string;
  publisher?: string;
  publicationYear?: number;
  pages?: number;
  dimensions?: string;
  coverType?: string;
  originalPrice: number;
  salePrice: number;
  shortDescription?: string;
  description?: string;
  status?: string;
  isFeatured?: boolean;
  authorIds: number[];
  categoryIds: number[];
  initialStock?: number;
}

export interface BookUpdateRequest {
  title: string;
  slug?: string;
  isbn: string;
  coverImage?: string;
  publisher?: string;
  publicationYear?: number;
  pages?: number;
  dimensions?: string;
  coverType?: string;
  originalPrice: number;
  salePrice: number;
  shortDescription?: string;
  description?: string;
  status?: string;
  isFeatured?: boolean;
  authorIds?: number[];
  categoryIds?: number[];
  stockQuantity?: number;
}

export interface FileUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export const adminBookService = {
  createBook: async (data: BookCreateRequest): Promise<ApiResponse<Book>> => {
    const response = await apiClient.post<ApiResponse<Book>>('/books', data);
    return response.data;
  },

  updateBook: async (id: number, data: BookUpdateRequest): Promise<ApiResponse<Book>> => {
    const response = await apiClient.put<ApiResponse<Book>>(`/books/${id}`, data);
    return response.data;
  },

  updateBookStatus: async (id: number, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'): Promise<ApiResponse<Book>> => {
    const response = await apiClient.patch<ApiResponse<Book>>(`/books/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  uploadCoverImage: async (file: File): Promise<ApiResponse<FileUploadResult>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<FileUploadResult>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteBook: async (id: number): Promise<ApiResponse<string>> => {
    const response = await apiClient.delete<ApiResponse<string>>(`/books/${id}`);
    return response.data;
  }
};
