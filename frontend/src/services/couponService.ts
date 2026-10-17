import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { Coupon, CouponValidationResult } from '../types/coupon';

export const couponService = {
  async validateCoupon(code: string, orderAmount: number): Promise<CouponValidationResult> {
    const res = await apiClient.post<ApiResponse<CouponValidationResult>>('/coupons/validate', {
      code,
      orderAmount,
    });
    return res.data.data;
  },

  async getAvailableCoupons(): Promise<Coupon[]> {
    const res = await apiClient.get<ApiResponse<Coupon[]>>('/coupons/available');
    return res.data.data;
  },
};
