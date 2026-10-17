import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { Author } from '../types/book';

export interface AuthorRequest {
  name: string;
  slug?: string;
  biography?: string;
  avatarUrl?: string;
  nationality?: string;
}

export const adminAuthorService = {
  getAuthors: async (): Promise<ApiResponse<Author[]>> => {
    const response = await apiClient.get<ApiResponse<Author[]>>('/authors');
    return response.data;
  },

  createAuthor: async (data: AuthorRequest): Promise<ApiResponse<Author>> => {
    const response = await apiClient.post<ApiResponse<Author>>('/authors', data);
    return response.data;
  },

  updateAuthor: async (id: number, data: AuthorRequest): Promise<ApiResponse<Author>> => {
    const response = await apiClient.put<ApiResponse<Author>>(`/authors/${id}`, data);
    return response.data;
  },

  deleteAuthor: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/authors/${id}`);
    return response.data;
  }
};
