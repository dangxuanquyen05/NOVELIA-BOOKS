import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { Coupon, CreateCouponInput, UpdateCouponInput } from '../types/coupon';

export const adminCouponService = {
  async getAllCoupons(keyword?: string, page = 0, size = 10): Promise<PageResponse<Coupon>> {
    const res = await apiClient.get<ApiResponse<PageResponse<Coupon>>>('/admin/coupons', {
      params: { keyword: keyword || undefined, page, size },
    });
    return res.data.data;
  },

  async getCouponById(id: number): Promise<Coupon> {
    const res = await apiClient.get<ApiResponse<Coupon>>(`/admin/coupons/${id}`);
    return res.data.data;
  },

  async createCoupon(input: CreateCouponInput): Promise<Coupon> {
    const res = await apiClient.post<ApiResponse<Coupon>>('/admin/coupons', input);
    return res.data.data;
  },

  async updateCoupon(id: number, input: UpdateCouponInput): Promise<Coupon> {
    const res = await apiClient.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, input);
    return res.data.data;
  },

  async toggleCouponStatus(id: number): Promise<void> {
    await apiClient.patch<ApiResponse<void>>(`/admin/coupons/${id}/toggle`);
  },

  async terminateCoupon(id: number): Promise<void> {
    await apiClient.patch<ApiResponse<void>>(`/admin/coupons/${id}/terminate`);
  },

  async deleteCoupon(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/admin/coupons/${id}`);
  },
};
