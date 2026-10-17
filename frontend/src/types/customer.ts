import type { Order } from './order';

export interface CustomerAddress {
  id: number;
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailedAddress: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface CustomerItem {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  roles: string[];
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface CustomerDetail {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  roles: string[];
  createdAt: string;
  updatedAt?: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  addresses: CustomerAddress[];
  recentOrders: Order[];
}

export interface UpdateCustomerStatusRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  reason?: string;
}
