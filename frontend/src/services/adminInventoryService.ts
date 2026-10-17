import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type {
  InventoryItem,
  InventorySummary,
  InventoryTransactionItem,
  InventoryAdjustRequest,
  TransactionType,
  StockStatusFilter,
  GoodsReceiptRequest,
  GoodsReceiptResponse,
  UpdateThresholdRequest,
} from '../types/inventory';

export const adminInventoryService = {
  getInventories: async (params?: {
    keyword?: string;
    status?: StockStatusFilter;
    lowStockOnly?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<InventoryItem>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryItem>>>('/admin/inventory', {
      params,
    });
    return response.data.data;
  },

  getInventorySummary: async (): Promise<InventorySummary> => {
    const response = await apiClient.get<ApiResponse<InventorySummary>>('/admin/inventory/summary');
    return response.data.data;
  },

  getLowStockCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/admin/inventory/low-stock-count');
    return response.data.data;
  },

  getTransactions: async (params?: {
    bookId?: number;
    type?: TransactionType;
    page?: number;
    size?: number;
  }): Promise<PageResponse<InventoryTransactionItem>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryTransactionItem>>>(
      '/admin/inventory/transactions',
      { params }
    );
    return response.data.data;
  },

  adjustInventory: async (data: InventoryAdjustRequest): Promise<InventoryItem> => {
    const response = await apiClient.post<ApiResponse<InventoryItem>>('/admin/inventory/adjust', data);
    return response.data.data;
  },

  updateThreshold: async (bookId: number, data: UpdateThresholdRequest): Promise<InventoryItem> => {
    const response = await apiClient.put<ApiResponse<InventoryItem>>(`/admin/inventory/${bookId}/threshold`, data);
    return response.data.data;
  },

  createGoodsReceipt: async (data: GoodsReceiptRequest): Promise<GoodsReceiptResponse> => {
    const response = await apiClient.post<ApiResponse<GoodsReceiptResponse>>('/admin/inventory/import-receipt', data);
    return response.data.data;
  },
};
