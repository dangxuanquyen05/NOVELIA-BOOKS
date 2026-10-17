import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { CreateShipmentInput, Shipment, UpdateShipmentStatusInput } from '../types/shipment';

export const adminShipmentService = {
  async getAllShipments(page = 0, size = 10): Promise<PageResponse<Shipment>> {
    const res = await apiClient.get<ApiResponse<PageResponse<Shipment>>>('/admin/shipments', {
      params: { page, size },
    });
    return res.data.data;
  },

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    const res = await apiClient.post<ApiResponse<Shipment>>('/admin/shipments', input);
    return res.data.data;
  },

  async updateStatus(id: number, input: UpdateShipmentStatusInput): Promise<Shipment> {
    const res = await apiClient.put<ApiResponse<Shipment>>(`/admin/shipments/${id}/status`, input);
    return res.data.data;
  },

  async getShipmentByOrderId(orderId: number): Promise<Shipment> {
    const res = await apiClient.get<ApiResponse<Shipment>>(`/shipments/order/${orderId}`);
    return res.data.data;
  },

  async trackShipment(trackingNumber: string): Promise<Shipment> {
    const res = await apiClient.get<ApiResponse<Shipment>>(`/shipments/track/${trackingNumber}`);
    return res.data.data;
  },

  async calculateFee(input: import('../types/shipment').ShippingFeeCalculateInput): Promise<import('../types/shipment').ShippingFeeCalculateResult> {
    const res = await apiClient.post<ApiResponse<import('../types/shipment').ShippingFeeCalculateResult>>('/shipments/calculate-fee', input);
    return res.data.data;
  },
};
