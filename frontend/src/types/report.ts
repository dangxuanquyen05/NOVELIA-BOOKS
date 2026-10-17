export interface PeriodComparisonReport {
  currentRevenue: number;
  previousRevenue: number;
  revenueGrowthPercentage?: number | null;
  revenueVariance: number;
  currentValidOrders: number;
  previousValidOrders: number;
  ordersGrowthPercentage?: number | null;
  currentAov: number;
  previousAov: number;
  aovGrowthPercentage?: number | null;
}

export interface BusinessOverviewReport {
  startDate: string;
  endDate: string;
  periodDays: number;
  realizedRevenue: number;
  grossOrderValue: number;
  pendingRevenue: number;
  cancelledRevenue: number;
  totalOrders: number;
  validOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  averageOrderValue: number;
  hasCostPriceConfigured: boolean;
  grossProfit?: number | null;
  profitNote: string;
  revenueRuleNote: string;
  periodComparison: PeriodComparisonReport;
}

export interface RevenueTrendReportPoint {
  date: string;
  label: string;
  realizedRevenue: number;
  grossOrderValue: number;
  validOrdersCount: number;
  totalOrdersCount: number;
}

export interface OrderStatusReportItem {
  status: string;
  statusLabel: string;
  orderCount: number;
  totalAmount: number;
  countPercentage: number;
  amountPercentage: number;
}

export interface TopBookReportItem {
  bookId: number;
  bookTitle: string;
  coverImage?: string;
  soldQuantity: number;
  revenue: number;
}

export interface CategoryPerformanceReportItem {
  categoryId: number;
  categoryName: string;
  itemsCount: number;
  soldQuantity: number;
  revenue: number;
  revenuePercentage: number;
}

export interface TopCustomerReportItem {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  completedOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}
