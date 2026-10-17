import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { Category } from '../types/book';

export interface CategoryRequest {
  parentId?: number | null;
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export const adminCategoryService = {
  getCategories: async (tree: boolean = false, activeOnly: boolean = false): Promise<ApiResponse<Category[]>> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: { tree, activeOnly }
    });
    return response.data;
  },

  createCategory: async (data: CategoryRequest): Promise<ApiResponse<Category>> => {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: CategoryRequest): Promise<ApiResponse<Category>> => {
    const response = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/categories/${id}`);
    return response.data;
  }
};
