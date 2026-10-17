import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { AuditLog, AuditLogFilterParams } from '../types/auditLog';

export const adminAuditLogService = {
  getAuditLogs: async (params: AuditLogFilterParams = {}): Promise<PageResponse<AuditLog>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AuditLog>>>('/admin/audit-logs', { params });
    return response.data.data;
  },

  getAvailableActions: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/admin/audit-logs/actions');
    return response.data.data;
  },

  getAvailableEntityTypes: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/admin/audit-logs/entity-types');
    return response.data.data;
  },
};
