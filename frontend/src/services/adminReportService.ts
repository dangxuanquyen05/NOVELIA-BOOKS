import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type {
  BusinessOverviewReport,
  RevenueTrendReportPoint,
  OrderStatusReportItem,
  TopBookReportItem,
  CategoryPerformanceReportItem,
  TopCustomerReportItem,
} from '../types/report';

export const adminReportService = {
  getOverview: async (startDate?: string, endDate?: string): Promise<BusinessOverviewReport> => {
    const response = await apiClient.get<ApiResponse<BusinessOverviewReport>>('/admin/reports/overview', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getRevenueTrend: async (
    startDate?: string,
    endDate?: string,
    groupBy: string = 'DAY'
  ): Promise<RevenueTrendReportPoint[]> => {
    const response = await apiClient.get<ApiResponse<RevenueTrendReportPoint[]>>('/admin/reports/revenue-trend', {
      params: { startDate, endDate, groupBy },
    });
    return response.data.data;
  },

  getOrderStatusDistribution: async (startDate?: string, endDate?: string): Promise<OrderStatusReportItem[]> => {
    const response = await apiClient.get<ApiResponse<OrderStatusReportItem[]>>('/admin/reports/order-status', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getTopSellingBooks: async (
    startDate?: string,
    endDate?: string,
    sortBy: 'QUANTITY' | 'REVENUE' = 'REVENUE',
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<TopBookReportItem>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<TopBookReportItem>>>('/admin/reports/top-books', {
      params: { startDate, endDate, sortBy, page, size },
    });
    return response.data.data;
  },

  getCategoryPerformance: async (
    startDate?: string,
    endDate?: string
  ): Promise<CategoryPerformanceReportItem[]> => {
    const response = await apiClient.get<ApiResponse<CategoryPerformanceReportItem[]>>('/admin/reports/categories', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getTopCustomers: async (
    startDate?: string,
    endDate?: string,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<TopCustomerReportItem>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<TopCustomerReportItem>>>('/admin/reports/top-customers', {
      params: { startDate, endDate, page, size },
    });
    return response.data.data;
  },

  downloadCsv: async (reportType: string, startDate?: string, endDate?: string): Promise<void> => {
    const response = await apiClient.get('/admin/reports/export-csv', {
      params: { reportType, startDate, endDate },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `novelia_${reportType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
