import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { CheckoutSummary, CreateOrderRequest, Order } from '../types/order';

export const orderService = {
  getCheckoutSummary: async (): Promise<CheckoutSummary> => {
    const response = await apiClient.get<ApiResponse<CheckoutSummary>>('/orders/checkout-summary');
    return response.data.data;
  },

  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  },

  getOrderByOrderNumber: async (orderNumber: string): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${orderNumber}`);
    return response.data.data;
  },

  getMyOrders: async (page = 0, size = 10, status?: string): Promise<PageResponse<Order>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<Order>>>('/orders/my-orders', {
      params: { page, size, ...(status ? { status } : {}) },
    });
    return response.data.data;
  },

  cancelOrder: async (orderNumber: string, reason?: string): Promise<Order> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${orderNumber}/cancel`, {
      reason,
    });
    return response.data.data;
  },
};
