import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PaymentCallbackResult, PaymentUrlResponse } from '../types/payment';

export const paymentService = {
  async createPaymentUrl(orderNumber: string, paymentMethod = 'VNPAY', bankCode?: string): Promise<PaymentUrlResponse> {
    const res = await apiClient.post<ApiResponse<PaymentUrlResponse>>('/payment/create-url', {
      orderNumber,
      paymentMethod,
      bankCode: bankCode || undefined,
    });
    return res.data.data;
  },

  async processVNPayCallback(queryParams: Record<string, string>): Promise<PaymentCallbackResult> {
    const res = await apiClient.get<ApiResponse<PaymentCallbackResult>>('/payment/vnpay-callback', {
      params: queryParams,
    });
    return res.data.data;
  },

  async simulateTestPaymentSuccess(orderNumber: string): Promise<PaymentCallbackResult> {
    const res = await apiClient.post<ApiResponse<PaymentCallbackResult>>(`/payment/simulate-success/${orderNumber}`);
    return res.data.data;
  },
};
