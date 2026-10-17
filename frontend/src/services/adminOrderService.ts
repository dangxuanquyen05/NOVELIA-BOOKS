import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { Order } from '../types/order';

export const adminOrderService = {
  getAllOrders: async (params?: {
    status?: string;
    keyword?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Order>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<Order>>>('/admin/orders', {
      params,
    });
    return response.data.data;
  },

  getOrderDetail: async (orderNumber: string): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${orderNumber}`);
    return response.data.data;
  },

  updateOrderStatus: async (
    orderNumber: string,
    newStatus: string,
    note?: string
  ): Promise<Order> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/admin/orders/${orderNumber}/status`, {
      newStatus,
      note,
    });
    return response.data.data;
  },

  updatePaymentStatus: async (
    orderNumber: string,
    newStatus: string,
    transactionCode?: string,
    note?: string
  ): Promise<Order> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/admin/orders/${orderNumber}/payment`, {
      newStatus,
      transactionCode,
      note,
    });
    return response.data.data;
  },
};
