import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { DashboardStats } from '../types/adminDashboard';

export const adminDashboardService = {
  getStats: async (
    days: number = 7,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<DashboardStats>> => {
    const params: Record<string, any> = { days };
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats', {
      params
    });
    return response.data;
  }
};
