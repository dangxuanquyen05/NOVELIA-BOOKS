import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  Users,
  Award,
  Layers,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { adminReportService } from '../../services/adminReportService';
import type {
  BusinessOverviewReport,
  RevenueTrendReportPoint,
  OrderStatusReportItem,
  TopBookReportItem,
  CategoryPerformanceReportItem,
  TopCustomerReportItem,
} from '../../types/report';
import { Button } from '../../components/ui/Button';
import { AdminLayout } from '../../components/admin/AdminLayout';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

type DatePreset = 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';

export const AdminReportsPage: React.FC = () => {
  const [preset, setPreset] = useState<DatePreset>('30_DAYS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [overview, setOverview] = useState<BusinessOverviewReport | null>(null);
  const [trend, setTrend] = useState<RevenueTrendReportPoint[]>([]);
  const [orderDistribution, setOrderDistribution] = useState<OrderStatusReportItem[]>([]);
  const [topBooks, setTopBooks] = useState<TopBookReportItem[]>([]);
  const [bookSortBy, setBookSortBy] = useState<'REVENUE' | 'QUANTITY'>('REVENUE');
  const [categories, setCategories] = useState<CategoryPerformanceReportItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerReportItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [selectedExportType, setSelectedExportType] = useState<string>('OVERVIEW');

  // Compute preset dates
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7_DAYS') {
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === '30_DAYS') {
      const past = new Date();
      past.setDate(today.getDate() - 29);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'THIS_YEAR') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(todayStr);
    }
  }, [preset]);

  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
    }
  }, [startDate, endDate, bookSortBy]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [ovData, trendData, distData, booksData, catData, custData] = await Promise.all([
        adminReportService.getOverview(startDate, endDate),
        adminReportService.getRevenueTrend(startDate, endDate, 'DAY'),
        adminReportService.getOrderStatusDistribution(startDate, endDate),
        adminReportService.getTopSellingBooks(startDate, endDate, bookSortBy, 0, 8),
        adminReportService.getCategoryPerformance(startDate, endDate),
        adminReportService.getTopCustomers(startDate, endDate, 0, 8),
      ]);

      setOverview(ovData);
      setTrend(trendData);
      setOrderDistribution(distData);
      setTopBooks(booksData.content || []);
      setCategories(catData);
      setTopCustomers(custData.content || []);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await adminReportService.downloadCsv(selectedExportType, startDate, endDate);
      setExportModalOpen(false);
    } catch (err) {
      alert('Không thể xuất báo cáo CSV. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper formatting
  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return '0 đ';
    return `${Math.round(val).toLocaleString('vi-VN')} đ`;
  };

  const maxTrendRevenue = Math.max(...trend.map((t) => t.realizedRevenue), 1);

  return (
    <AdminLayout
      title="Báo Cáo & Phân Tích Kinh Doanh"
      subtitle="Thống kê doanh thu thực nhận, đối chiếu kỳ trước và phân tích hiệu quả bán hàng"
    >
      <div className="space-y-6">
        {/* Top Controls Bar */}
        <div className="bg-white rounded-3xl p-5 border border-[#E7E0D5] shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-stone-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Kỳ báo cáo:
            </span>
            <button
              type="button"
              onClick={() => setPreset('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                preset === 'TODAY'
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setPreset('7_DAYS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                preset === '7_DAYS'
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setPreset('30_DAYS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                preset === '30_DAYS'
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setPreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                preset === 'THIS_MONTH'
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => setPreset('THIS_YEAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                preset === 'THIS_YEAR'
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Năm nay
            </button>
            <button
              type="button"
              onClick={() => setPreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                preset === 'CUSTOM'
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Tùy chọn
            </button>
          </div>

          {/* Date Range Inputs & Action Buttons */}
          <div className="flex items-center gap-2.5 w-full xl:w-auto justify-between xl:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('CUSTOM');
                }}
                className="rounded-xl border border-[#D5CDC0] px-2.5 py-1.5 text-xs bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
              />
              <span className="text-stone-400">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('CUSTOM');
                }}
                className="rounded-xl border border-[#D5CDC0] px-2.5 py-1.5 text-xs bg-[#FAFAF8] focus:outline-none focus:border-[#1B3B2B]"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadReportData()}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Làm Mới
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Xuất CSV
            </Button>
          </div>
        </div>

        {/* Business Rule Notice Alert */}
        <div className="bg-[#FAF8F5] border border-[#E7E0D5] rounded-3xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-stone-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-[#1B3B2B]">
                Quy tắc tính toán doanh thu & lợi nhuận minh bạch:
              </p>
              <p className="text-stone-500 mt-0.5">
                • <strong>Doanh thu thực nhận:</strong> Chỉ tính từ đơn <em>Đã xác nhận, Đang giao, Đã giao thành công</em>. Đơn hủy và hoàn tiền được loại trừ 100%.
                <br />
                • <strong>Lợi nhuận gộp:</strong> Không tự suy đoán tỷ suất lợi nhuận giả định khi chưa có dữ liệu giá vốn chính thức.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-mono text-[11px] shrink-0">
            {overview?.periodDays || 0} ngày phân tích
          </div>
        </div>

        {/* 6 Main Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Doanh thu thực nhận */}
          <div className="bg-white border border-emerald-200 rounded-3xl p-4 shadow-xs col-span-1 sm:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Doanh Thu Thực Nhận
              </span>
              {overview?.periodComparison?.revenueGrowthPercentage !== null &&
                overview?.periodComparison?.revenueGrowthPercentage !== undefined && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      overview.periodComparison.revenueGrowthPercentage >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {overview.periodComparison.revenueGrowthPercentage >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-700" />
                    )}
                    {overview.periodComparison.revenueGrowthPercentage > 0 ? '+' : ''}
                    {overview.periodComparison.revenueGrowthPercentage}%
                  </span>
                )}
            </div>

            <p className="text-2xl font-serif font-bold text-emerald-900 mt-1">
              {formatCurrency(overview?.realizedRevenue)}
            </p>

            <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-stone-500">
              <span>Kỳ trước: {formatCurrency(overview?.periodComparison?.previousRevenue)}</span>
              <span className="font-mono text-stone-600">
                {overview?.periodComparison?.revenueVariance && overview.periodComparison.revenueVariance >= 0 ? '+' : ''}
                {formatCurrency(overview?.periodComparison?.revenueVariance)}
              </span>
            </div>
          </div>

          {/* Card 2: Tổng giá trị đặt hàng (GMV) */}
          <div className="bg-white border border-[#E7E0D5] rounded-3xl p-4 shadow-xs">
            <div className="text-xs text-stone-500 font-semibold mb-1 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-stone-400" /> Tổng Giá Trị (GMV)
            </div>
            <p className="text-lg font-serif font-bold text-[#1B3B2B] mt-1">
              {formatCurrency(overview?.grossOrderValue)}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">Bao gồm toàn bộ đơn</p>
          </div>

          {/* Card 3: Giá trị đơn trung bình (AOV) */}
          <div className="bg-white border border-[#E7E0D5] rounded-3xl p-4 shadow-xs">
            <div className="text-xs text-stone-500 font-semibold mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#C5A880]" /> Đơn Trung Bình (AOV)
            </div>
            <p className="text-lg font-serif font-bold text-[#1B3B2B] mt-1">
              {formatCurrency(overview?.averageOrderValue)}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {overview?.validOrders || 0} đơn hợp lệ
            </p>
          </div>

          {/* Card 4: Tỷ lệ hủy đơn */}
          <div className="bg-white border border-rose-200 rounded-3xl p-4 shadow-xs">
            <div className="text-xs text-rose-700 font-semibold mb-1 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Tỷ Lệ Hủy Đơn
            </div>
            <p className="text-lg font-serif font-bold text-rose-800 mt-1">
              {overview?.cancellationRate ?? 0}%
            </p>
            <p className="text-[11px] text-rose-600/80 mt-1">
              {overview?.cancelledOrders || 0} / {overview?.totalOrders || 0} đơn
            </p>
          </div>

          {/* Card 5: Đơn chờ xử lý */}
          <div className="bg-white border border-amber-200 rounded-3xl p-4 shadow-xs">
            <div className="text-xs text-amber-700 font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ Xác Nhận
            </div>
            <p className="text-lg font-serif font-bold text-amber-800 mt-1">
              {formatCurrency(overview?.pendingRevenue)}
            </p>
            <p className="text-[11px] text-amber-700/80 mt-1">
              {overview?.pendingOrders || 0} đơn PENDING
            </p>
          </div>
        </div>

        {/* Visual Revenue Trend Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1B3B2B] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" /> Xu Hướng Doanh Thu Thực Nhận Theo Ngày
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Chỉ tính các giao dịch đã hoàn tất và giao thành công
              </p>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              Đỉnh kỳ: <strong>{formatCurrency(maxTrendRevenue)}</strong>
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-stone-200 overflow-x-auto">
            {trend.map((point) => {
              const heightPct = Math.max(6, Math.round((point.realizedRevenue / maxTrendRevenue) * 100));
              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center justify-end h-full min-w-[20px] group relative"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#1B3B2B] text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none">
                    <span className="font-bold">{point.label}</span>
                    <span>{formatCurrency(point.realizedRevenue)} ({point.validOrdersCount} đơn)</span>
                    <div className="w-2 h-2 bg-[#1B3B2B] rotate-45 -mb-1 mt-0.5" />
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      point.realizedRevenue > 0
                        ? 'bg-emerald-700 group-hover:bg-emerald-600'
                        : 'bg-stone-200'
                    }`}
                  />
                  <span className="text-[10px] text-stone-400 mt-2 truncate max-w-full font-mono">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Columns Grid: Order Status Distribution & Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Box 1: Order Status Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs">
            <h3 className="font-serif font-bold text-base text-[#1B3B2B] mb-1 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#C5A880]" /> Cơ Cấu Trạng Thái Đơn Hàng
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Phân bổ số lượng và giá trị đơn hàng trong kỳ báo cáo
            </p>

            <div className="space-y-3">
              {orderDistribution.map((item) => {
                let badgeClass = 'bg-stone-100 text-stone-700';
                if (item.status === 'DELIVERED') badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (item.status === 'SHIPPING') badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
                if (item.status === 'CONFIRMED') badgeClass = 'bg-teal-50 text-teal-800 border-teal-200';
                if (item.status === 'PENDING') badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                if (item.status === 'CANCELLED' || item.status === 'REFUNDED') badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';

                return (
                  <div key={item.status} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`inline-block px-2 py-0.5 rounded-md font-semibold border ${badgeClass}`}>
                        {item.statusLabel}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-stone-800">
                          {item.orderCount} đơn ({item.countPercentage}%)
                        </span>
                        <span className="text-stone-500 font-mono w-28 text-right">
                          {formatCurrency(item.totalAmount)}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${item.countPercentage}%` }}
                        className={`h-full rounded-full ${
                          item.status === 'DELIVERED'
                            ? 'bg-emerald-600'
                            : item.status === 'CANCELLED'
                            ? 'bg-rose-500'
                            : item.status === 'PENDING'
                            ? 'bg-amber-500'
                            : 'bg-stone-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Box 2: Category Performance */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs">
            <h3 className="font-serif font-bold text-base text-[#1B3B2B] mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C5A880]" /> Hiệu Quả Theo Thể Loại Sách
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Đóng góp doanh số của từng thể loại vào tổng doanh thu
            </p>

            {categories.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">Chưa có giao dịch danh mục nào trong kỳ.</p>
            ) : (
              <div className="space-y-3.5">
                {categories.map((cat) => (
                  <div key={cat.categoryId} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1B3B2B]">{cat.categoryName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-500">{cat.soldQuantity} cuốn bán</span>
                        <span className="font-mono font-bold text-emerald-800 w-24 text-right">
                          {formatCurrency(cat.revenue)}
                        </span>
                        <span className="text-stone-400 w-12 text-right">({cat.revenuePercentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, cat.revenuePercentage)}%` }}
                        className="h-full bg-[#1B3B2B] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Two Columns Grid: Top Books & Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Books */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1B3B2B] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" /> Sách Bán Chạy Nhất
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">Xếp hạng tác phẩm mang lại hiệu quả cao</p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E7E0D5]">
                <button
                  type="button"
                  onClick={() => setBookSortBy('REVENUE')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    bookSortBy === 'REVENUE'
                      ? 'bg-white text-[#1B3B2B] shadow-xs font-bold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Theo Doanh Thu
                </button>
                <button
                  type="button"
                  onClick={() => setBookSortBy('QUANTITY')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    bookSortBy === 'QUANTITY'
                      ? 'bg-white text-[#1B3B2B] shadow-xs font-bold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Theo Số Lượng
                </button>
              </div>
            </div>

            {topBooks.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">Chưa có dữ liệu sách bán ra trong kỳ.</p>
            ) : (
              <div className="divide-y divide-[#F0ECE1]">
                {topBooks.map((b, idx) => (
                  <div key={b.bookId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center font-serif font-bold text-stone-400">
                        {idx + 1}
                      </span>
                      <img
                        src={b.coverImage || FALLBACK_COVER}
                        alt={b.bookTitle}
                        className="w-8 h-11 object-cover rounded border border-[#E7E0D5] shrink-0"
                      />
                      <span className="font-bold text-[#1B3B2B] truncate max-w-[200px]">
                        {b.bookTitle}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-800 block">
                        {formatCurrency(b.revenue)}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {b.soldQuantity} cuốn đã bán
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top VIP Customers */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs">
            <h3 className="font-serif font-bold text-base text-[#1B3B2B] mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" /> Khách Hàng Tiêu Biểu (Top Spenders)
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Khách hàng có tổng chi tiêu và số đơn thành công cao nhất trong kỳ
            </p>

            {topCustomers.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">Chưa có khách hàng phát sinh đơn hợp lệ trong kỳ.</p>
            ) : (
              <div className="divide-y divide-[#F0ECE1]">
                {topCustomers.map((c, idx) => (
                  <div key={c.userId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center font-serif font-bold text-stone-400">
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-[#1B3B2B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {(c.fullName || c.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-[#1B3B2B] block truncate">
                          {c.fullName || 'Khách vãng lai'}
                        </span>
                        <span className="text-[11px] text-stone-400 block truncate font-mono">
                          {c.email}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-800 block">
                        {formatCurrency(c.totalSpent)}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {c.completedOrders} đơn hoàn thành
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Export CSV Options */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7E0D5] shadow-2xl relative">
              <h3 className="font-serif font-bold text-lg text-[#1B3B2B] mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" /> Xuất Báo Cáo Kinh Doanh (CSV)
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Dữ liệu được mã hóa chuẩn UTF-8 có BOM hiển thị tiếng Việt hoàn hảo trên Microsoft Excel.
              </p>

              <div className="space-y-2 mb-6">
                <label
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedExportType === 'OVERVIEW'
                      ? 'border-[#1B3B2B] bg-[#FAF8F5]'
                      : 'border-[#E7E0D5] hover:bg-stone-50'
                  }`}
                  onClick={() => setSelectedExportType('OVERVIEW')}
                >
                  <div className="text-xs">
                    <p className="font-bold text-[#1B3B2B]">Báo cáo Tổng quan KPIs</p>
                    <p className="text-stone-400 text-[11px]">Doanh thu thực nhận, GMV, AOV, tỷ lệ hủy, so sánh kỳ trước</p>
                  </div>
                  <input
                    type="radio"
                    name="exportType"
                    checked={selectedExportType === 'OVERVIEW'}
                    onChange={() => setSelectedExportType('OVERVIEW')}
                    className="accent-[#1B3B2B]"
                  />
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedExportType === 'DAILY_REVENUE'
                      ? 'border-[#1B3B2B] bg-[#FAF8F5]'
                      : 'border-[#E7E0D5] hover:bg-stone-50'
                  }`}
                  onClick={() => setSelectedExportType('DAILY_REVENUE')}
                >
                  <div className="text-xs">
                    <p className="font-bold text-[#1B3B2B]">Báo cáo Doanh thu theo Ngày</p>
                    <p className="text-stone-400 text-[11px]">Chi tiết doanh thu thực nhận, GMV và số đơn mỗi ngày</p>
                  </div>
                  <input
                    type="radio"
                    name="exportType"
                    checked={selectedExportType === 'DAILY_REVENUE'}
                    onChange={() => setSelectedExportType('DAILY_REVENUE')}
                    className="accent-[#1B3B2B]"
                  />
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedExportType === 'TOP_BOOKS'
                      ? 'border-[#1B3B2B] bg-[#FAF8F5]'
                      : 'border-[#E7E0D5] hover:bg-stone-50'
                  }`}
                  onClick={() => setSelectedExportType('TOP_BOOKS')}
                >
                  <div className="text-xs">
                    <p className="font-bold text-[#1B3B2B]">Báo cáo Sách Bán Chạy</p>
                    <p className="text-stone-400 text-[11px]">Xếp hạng tác phẩm theo số lượng bán và doanh thu</p>
                  </div>
                  <input
                    type="radio"
                    name="exportType"
                    checked={selectedExportType === 'TOP_BOOKS'}
                    onChange={() => setSelectedExportType('TOP_BOOKS')}
                    className="accent-[#1B3B2B]"
                  />
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedExportType === 'TOP_CUSTOMERS'
                      ? 'border-[#1B3B2B] bg-[#FAF8F5]'
                      : 'border-[#E7E0D5] hover:bg-stone-50'
                  }`}
                  onClick={() => setSelectedExportType('TOP_CUSTOMERS')}
                >
                  <div className="text-xs">
                    <p className="font-bold text-[#1B3B2B]">Báo cáo Khách Hàng Tiêu Biểu</p>
                    <p className="text-stone-400 text-[11px]">Danh sách khách hàng mua nhiều đơn và chi tiêu cao nhất</p>
                  </div>
                  <input
                    type="radio"
                    name="exportType"
                    checked={selectedExportType === 'TOP_CUSTOMERS'}
                    onChange={() => setSelectedExportType('TOP_CUSTOMERS')}
                    className="accent-[#1B3B2B]"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportModalOpen(false)}
                  disabled={isExporting}
                >
                  Hủy Bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  leftIcon={isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                >
                  Tải Xuống CSV
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
