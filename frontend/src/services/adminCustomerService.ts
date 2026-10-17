import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { CustomerItem, CustomerDetail, UpdateCustomerStatusRequest } from '../types/customer';

export const adminCustomerService = {
  getCustomers: async (params?: {
    keyword?: string;
    status?: string;
    role?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<CustomerItem>>> => {
    const queryParams: Record<string, string | number> = {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    };
    if (params?.keyword && params.keyword.trim() !== '') {
      queryParams.keyword = params.keyword.trim();
    }
    if (params?.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }
    if (params?.role && params.role !== 'ALL') {
      queryParams.role = params.role;
    }
    const response = await apiClient.get<ApiResponse<PageResponse<CustomerItem>>>('/admin/customers', {
      params: queryParams,
    });
    return response.data;
  },

  getCustomerDetails: async (id: number): Promise<ApiResponse<CustomerDetail>> => {
    const response = await apiClient.get<ApiResponse<CustomerDetail>>(`/admin/customers/${id}`);
    return response.data;
  },

  updateCustomerStatus: async (
    id: number,
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED',
    reason?: string
  ): Promise<ApiResponse<CustomerItem>> => {
    const body: UpdateCustomerStatusRequest = { status, reason };
    const response = await apiClient.put<ApiResponse<CustomerItem>>(`/admin/customers/${id}/status`, body);
    return response.data;
  },
};
