import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { Address, AddressRequest } from '../types/order';

export const addressService = {
  getMyAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get<ApiResponse<Address[]>>('/addresses');
    return response.data.data;
  },

  createAddress: async (data: AddressRequest): Promise<Address> => {
    const response = await apiClient.post<ApiResponse<Address>>('/addresses', data);
    return response.data.data;
  },

  updateAddress: async (id: number, data: AddressRequest): Promise<Address> => {
    const response = await apiClient.put<ApiResponse<Address>>(`/addresses/${id}`, data);
    return response.data.data;
  },

  setDefaultAddress: async (id: number): Promise<Address> => {
    const response = await apiClient.put<ApiResponse<Address>>(`/addresses/${id}/default`);
    return response.data.data;
  },

  deleteAddress: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/addresses/${id}`);
  },
};
