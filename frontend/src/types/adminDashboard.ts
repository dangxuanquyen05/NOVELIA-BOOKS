import type { Order } from './order';
import type { InventoryItem } from './inventory';

export interface DashboardKpis {
  totalRevenue: number;
  todayRevenue: number;
  periodRevenue?: number;
  previousPeriodRevenue?: number;
  growthRatePercentage?: number | null;
  grossOrderValue?: number;
  estimatedNetProfit?: number | null;
  averageOrderValue?: number;
  validOrdersCount?: number;
  cancelledOrdersCount?: number;
  refundedOrdersCount?: number;
  refundedAmount?: number;
  totalOrders: number;
  periodOrders?: number;
  pendingOrdersCount: number;
  totalCustomers: number;
  totalBooks: number;
  lowStockBooksCount: number;
  revenueRuleDescription: string;
}

export interface RevenueTrendPoint {
  date: string; // YYYY-MM-DD
  formattedDate: string; // dd/MM
  revenue: number;
  orderCount: number;
}

export interface OrderStatusDistribution {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface CategoryRevenueDistribution {
  categoryName: string;
  revenue: number;
  percentage: number;
}

export interface TopSellingBook {
  bookId: number;
  title: string;
  coverImage?: string;
  totalSold: number;
  totalRevenue: number;
}

export interface DashboardStats {
  kpis: DashboardKpis;
  revenueTrend: RevenueTrendPoint[];
  orderDistribution: OrderStatusDistribution[];
  categoryDistribution?: CategoryRevenueDistribution[];
  topSellingBooks: TopSellingBook[];
  recentOrders: Order[];
  lowStockAlerts: InventoryItem[];
}
