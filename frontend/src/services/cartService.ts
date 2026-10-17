import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { Cart } from '../types/cart';

export const cartService = {
  // Lấy giỏ hàng của người dùng hiện tại
  getMyCart: async (): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.get<ApiResponse<Cart>>('/cart');
    return response.data;
  },

  // Thêm sách vào giỏ
  addToCart: async (bookId: number, quantity: number = 1): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.post<ApiResponse<Cart>>('/cart/items', {
      bookId,
      quantity,
    });
    return response.data;
  },

  // Cập nhật số lượng item
  updateCartItem: async (itemId: number, quantity: number): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data;
  },

  // Xóa 1 item khỏi giỏ
  removeCartItem: async (itemId: number): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return response.data;
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async (): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.delete<ApiResponse<Cart>>('/cart');
    return response.data;
  },
};
