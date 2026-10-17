export interface AuditLog {
  id: number;
  performedBy: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  details: string | null;
  ipAddress: string | null;
  status: 'SUCCESS' | 'FAILED' | string;
  createdAt: string;
}

export interface AuditLogFilterParams {
  action?: string;
  entityType?: string;
  performedBy?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
