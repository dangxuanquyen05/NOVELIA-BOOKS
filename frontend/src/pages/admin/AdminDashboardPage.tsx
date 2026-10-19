import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminDashboardService } from '../../services/adminDashboardService';
import type { DashboardStats, RevenueTrendPoint } from '../../types/adminDashboard';
import { formatCurrencyVND } from '../../utils/format';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Sparkles,
  Calendar,
  Download,
  DollarSign,
  Layers,
  ArrowUpRight,
  Search,
  Calculator,
  Receipt,
  Package,
  RotateCcw
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

type PresetTimeRange = 1 | 7 | 30 | 90 | 'custom';
type ChartMetricFilter = 'all' | 'revenue' | 'orders';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time filters
  const [selectedPreset, setSelectedPreset] = useState<PresetTimeRange>(7);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Search & Chart filters
  const [searchQuery, setSearchQuery] = useState('');
  const [chartMetric, setChartMetric] = useState<ChartMetricFilter>('all');
  const [hoveredPoint, setHoveredPoint] = useState<RevenueTrendPoint | null>(null);

  const fetchDashboardData = async (preset: PresetTimeRange = selectedPreset) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (preset === 'custom') {
        res = await adminDashboardService.getStats(0, customStartDate, customEndDate);
      } else {
        res = await adminDashboardService.getStats(preset);
      }

      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.message || 'Không thể nạp dữ liệu thống kê quản trị');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Lỗi khi kết nối đến máy chủ quản trị NOVELIA BOOKS';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedPreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset]);

  const handleApplyCustomDate = () => {
    if (!customStartDate || !customEndDate) return;
    if (customStartDate > customEndDate) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
      return;
    }
    setSelectedPreset('custom');
    fetchDashboardData('custom');
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (/^ORD/i.test(q) || /^\d+$/.test(q)) {
      navigate(`/admin/orders?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/admin/books?search=${encodeURIComponent(q)}`);
    }
  };

  // Export CSV report with UTF-8 BOM
  const handleExportCSV = () => {
    if (!stats) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csvContent += 'BÁO CÁO THỐNG KÊ KINH DOANH - NOVELIA BOOKS\n';
    csvContent += `Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

    csvContent += '1. CHỈ SỐ KPI CHÍNH\n';
    csvContent += `Doanh thu thuần trong kỳ (Net Valid Revenue),${stats.kpis.periodRevenue || 0} VND\n`;
    csvContent += `Doanh thu hôm nay,${stats.kpis.todayRevenue || 0} VND\n`;
    csvContent += `Tổng doanh thu lũy kế,${stats.kpis.totalRevenue || 0} VND\n`;
    csvContent += `Giá trị đơn hàng trung bình (AOV),${stats.kpis.averageOrderValue || 0} VND\n`;
    csvContent += `Tổng giá trị đơn hàng phát sinh (GOV),${stats.kpis.grossOrderValue || 0} VND\n`;
    csvContent += `Số đơn hợp lệ trong kỳ,${stats.kpis.validOrdersCount ?? (stats.kpis.periodOrders || 0)}\n`;
    csvContent += `Số đơn phát sinh trong kỳ,${stats.kpis.periodOrders || 0}\n`;
    csvContent += `Số đơn chờ xử lý,${stats.kpis.pendingOrdersCount}\n`;
    csvContent += `Số đơn hủy trong kỳ,${stats.kpis.cancelledOrdersCount || 0}\n`;
    csvContent += `Số đơn hoàn tiền trong kỳ,${stats.kpis.refundedOrdersCount || 0}\n`;
    csvContent += `Tổng số tiền đã hoàn trả,${stats.kpis.refundedAmount || 0} VND\n`;
    csvContent += `Số khách hàng độc giả,${stats.kpis.totalCustomers}\n`;
    csvContent += `Tổng số đầu sách,${stats.kpis.totalBooks}\n`;
    csvContent += `Số sách cảnh báo cần bổ sung tồn kho,${stats.kpis.lowStockBooksCount}\n\n`;

    csvContent += '2. XU HƯỚNG DOANH THU VÀ ĐƠN HÀNG THEO NGÀY\n';
    csvContent += 'Ngày,Doanh thu (VND),Số đơn hợp lệ\n';
    stats.revenueTrend.forEach((pt) => {
      csvContent += `${pt.date},${pt.revenue},${pt.orderCount}\n`;
    });
    csvContent += '\n';

    if (stats.categoryDistribution && stats.categoryDistribution.length > 0) {
      csvContent += '3. CƠ CẤU DOANH THU THEO THỂ LOẠI\n';
      csvContent += 'Thể loại,Doanh thu (VND),Tỉ lệ (%)\n';
      stats.categoryDistribution.forEach((cat) => {
        csvContent += `"${cat.categoryName}",${cat.revenue},${cat.percentage}%\n`;
      });
      csvContent += '\n';
    }

    if (stats.topSellingBooks && stats.topSellingBooks.length > 0) {
      csvContent += '4. TOP SÁCH BÁN CHẠY NHẤT\n';
      csvContent += 'Mã sách,Tên sách,Số lượng đã bán,Doanh thu (VND)\n';
      stats.topSellingBooks.forEach((b) => {
        csvContent += `${b.bookId},"${b.title.replace(/"/g, '""')}",${b.totalSold},${b.totalRevenue}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `novelia_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tính toán kích thước và tọa độ cho SVG Chart (Dual-Axis)
  const trendPoints = stats?.revenueTrend || [];
  const maxRevenue = Math.max(...trendPoints.map((p) => p.revenue), 1000000);
  const maxOrders = Math.max(...trendPoints.map((p) => p.orderCount), 5);
  const chartHeight = 230;
  const chartWidth = 740;
  const paddingX = 44;
  const paddingY = 32;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / Math.max(trendPoints.length - 1, 1)) * usableWidth;
    const y = chartHeight - paddingY - (val / maxRevenue) * usableHeight;
    return { x, y };
  };

  const getOrderBarHeight = (orderCount: number) => {
    return (orderCount / maxOrders) * (usableHeight * 0.7);
  };

  const pointsString = trendPoints
    .map((p, idx) => {
      const { x, y } = getCoordinates(idx, p.revenue);
      return `${x},${y}`;
    })
    .join(' ');

  const areaString = trendPoints.length > 0
    ? `${pointsString} ${getCoordinates(trendPoints.length - 1, 0).x},${chartHeight - paddingY} ${paddingX},${chartHeight - paddingY}`
    : '';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Chờ xử lý</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"><CheckCircle2 className="w-3 h-3" /> Đã xác nhận</span>;
      case 'SHIPPING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200"><Truck className="w-3 h-3" /> Đang giao</span>;
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Giao thành công</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200"><XCircle className="w-3 h-3" /> Đã hủy</span>;
      case 'REFUNDED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"><RotateCcw className="w-3 h-3" /> Đã hoàn tiền</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">{status}</span>;
    }
  };

  const getGrowthBadge = (growth: number | null | undefined) => {
    if (growth === undefined || growth === null) {
      return (
        <span className="text-[11px] text-stone-400 italic">
          Chưa đủ dữ liệu kỳ trước
        </span>
      );
    }
    if (growth > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <TrendingUp className="w-3 h-3" />
          +{growth}% so với kỳ trước
        </span>
      );
    }
    if (growth < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
          <TrendingDown className="w-3 h-3" />
          {growth}% so với kỳ trước
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
        0% ổn định
      </span>
    );
  };

  return (
    <AdminLayout
      title="Tổng quan tốt!"
      subtitle="Báo cáo phân tích doanh thu, cơ cấu đơn hàng và quản trị kho sách thực tế"
    >
      <div className="space-y-8">
        {/* Top Control Bar: Search, Date Filter & Actions */}
        <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Quick Search */}
          <form onSubmit={handleQuickSearch} className="relative w-full xl:w-72 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh đơn (ORD...), sách..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8C5D3B] text-stone-800 placeholder-stone-400"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          </form>

          {/* Preset Buttons & Custom Date */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
              Khoảng thời gian:
            </span>

            <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
              {[
                { label: 'Hôm nay', value: 1 as PresetTimeRange },
                { label: '7 ngày qua', value: 7 as PresetTimeRange },
                { label: '30 ngày qua', value: 30 as PresetTimeRange },
                { label: '90 ngày qua', value: 90 as PresetTimeRange },
                { label: 'Tùy chọn', value: 'custom' as PresetTimeRange },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setSelectedPreset(item.value);
                    if (item.value !== 'custom') {
                      fetchDashboardData(item.value);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPreset === item.value
                      ? 'bg-[#8C5D3B] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {selectedPreset === 'custom' && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C5D3B]"
                />
                <span className="text-xs text-stone-400">đến</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C5D3B]"
                />
                <Button size="sm" variant="primary" onClick={handleApplyCustomDate}>
                  Áp dụng
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end xl:self-auto shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              disabled={!stats}
              leftIcon={<Download className="w-3.5 h-3.5 text-[#8C5D3B]" />}
            >
              Xuất CSV
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchDashboardData(selectedPreset)}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* Error Alert with Retry */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDashboardData(selectedPreset)}
              className="font-bold underline text-xs text-rose-900 hover:text-rose-700 ml-4 cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Loading Skeleton Grid */}
        {loading && !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-[#E7E0D5] animate-pulse space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-stone-200 rounded w-20"></div>
                  <div className="w-8 h-8 bg-stone-100 rounded-xl"></div>
                </div>
                <div className="h-6 bg-stone-200 rounded w-28"></div>
                <div className="h-3 bg-stone-100 rounded w-20"></div>
                <div className="pt-3 border-t border-stone-100 h-3 bg-stone-100 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Primary KPI Cards Grid (6 cards) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Doanh Thu Thuần Trong Kỳ */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Doanh Thu Trong Kỳ
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif-title text-xl font-bold text-[#1C1917]">
                {formatCurrencyVND(stats?.kpis.periodRevenue || 0)}
              </div>
              <div className="mt-2.5">
                {getGrowthBadge(stats?.kpis.growthRatePercentage)}
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Hôm nay:</span>
                <span className="font-semibold text-emerald-800">
                  {formatCurrencyVND(stats?.kpis.todayRevenue || 0)}
                </span>
              </div>
            </div>

            {/* Card 2: Doanh Thu Lũy Kế */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Doanh Thu Lũy Kế
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 text-[#8C6D2D] flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif-title text-xl font-bold text-[#1C1917]">
                {formatCurrencyVND(stats?.kpis.totalRevenue || 0)}
              </div>
              <p className="mt-2.5 text-[11px] text-stone-400">
                Chỉ tính đơn xác nhận/thành công
              </p>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1 text-[11px] text-stone-400">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span className="truncate">Chuẩn kế toán thực tế</span>
              </div>
            </div>

            {/* Card 3: Số Đơn Hàng Hợp Lệ / Phát Sinh */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Đơn Hàng Trong Kỳ
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif-title text-xl font-bold text-[#1C1917]">
                {stats?.kpis.validOrdersCount ?? (stats?.kpis.periodOrders || 0)} đơn
              </div>
              <p className="mt-2.5 text-[11px] text-stone-500">
                Hợp lệ / Tổng {stats?.kpis.periodOrders || 0} phát sinh
              </p>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Tổng phát sinh:</span>
                <span className="font-semibold text-stone-700">{formatCurrencyVND(stats?.kpis.grossOrderValue || 0)}</span>
              </div>
            </div>

            {/* Card 4: Giá Trị Đơn Trung Bình (AOV) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Giá Trị Đơn TB (AOV)
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif-title text-xl font-bold text-[#1C1917]">
                {formatCurrencyVND(stats?.kpis.averageOrderValue || 0)}
              </div>
              <p className="mt-2.5 text-[11px] text-stone-500">
                Doanh thu thuần / Đơn hợp lệ
              </p>
              <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-400 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-teal-600" />
                <span>Sức mua bình quân</span>
              </div>
            </div>

            {/* Card 5: Đơn Chờ Xử Lý & Hoàn Tiền */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Đơn Chờ & Hoàn Trả
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif-title text-xl font-bold text-amber-900">
                {stats?.kpis.pendingOrdersCount || 0} chờ duyệt
              </div>
              <p className="mt-2.5 text-[11px] text-stone-500">
                {stats?.kpis.cancelledOrdersCount || 0} hủy • {stats?.kpis.refundedOrdersCount || 0} hoàn tiền
              </p>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                <Link to="/admin/orders?status=PENDING" className="font-semibold text-[#8C5D3B] hover:underline inline-flex items-center gap-1">
                  Duyệt ngay <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {(stats?.kpis.refundedAmount || 0) > 0 && (
                  <span className="text-[10px] text-purple-700 font-semibold">
                    -{formatCurrencyVND(stats?.kpis.refundedAmount || 0)}
                  </span>
                )}
              </div>
            </div>

            {/* Card 6: Số Sách Cần Bổ Sung (Kho Hàng) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Sách Cần Bổ Sung
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif-title text-xl font-bold text-[#1C1917]">
                {stats?.kpis.lowStockBooksCount || 0} đầu sách
              </div>
              <div className="mt-2.5">
                {(stats?.kpis.lowStockBooksCount || 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <AlertTriangle className="w-3 h-3" />
                    Cần nhập thêm kho
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Tồn kho an toàn
                  </span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                <span className="text-stone-400">{stats?.kpis.totalBooks || 0} đầu sách</span>
                <Link to="/admin/inventory" className="font-semibold text-[#8C5D3B] hover:underline">
                  Nhập kho
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section: Revenue & Order Trend + Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main SVG Revenue & Order Trend Chart (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E7E0D5] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-title font-bold text-lg text-[#1C1917]">
                      Biểu Đồ Doanh Thu & Đơn Hàng
                    </h3>
                    <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {trendPoints.length} ngày hiển thị
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Số liệu doanh thu thuần và số đơn phát sinh thực tế từ đơn hợp lệ
                  </p>
                </div>

                {/* Metric Selector & Hover Tooltip */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="inline-flex rounded-lg bg-stone-100 p-0.5 border border-stone-200 text-xs">
                    <button
                      onClick={() => setChartMetric('all')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        chartMetric === 'all'
                          ? 'bg-[#8C5D3B] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Cả hai
                    </button>
                    <button
                      onClick={() => setChartMetric('revenue')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        chartMetric === 'revenue'
                          ? 'bg-[#8C5D3B] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Doanh thu
                    </button>
                    <button
                      onClick={() => setChartMetric('orders')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        chartMetric === 'orders'
                          ? 'bg-[#8C5D3B] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Số đơn
                    </button>
                  </div>

                  {hoveredPoint && (
                    <div className="text-right bg-[#1C1917] text-white px-3 py-1.5 rounded-xl shadow-md border border-[#D4AF7A]/30">
                      <p className="text-xs font-bold text-[#D4AF7A]">
                        {hoveredPoint.formattedDate}: {formatCurrencyVND(hoveredPoint.revenue)}
                      </p>
                      <p className="text-[10px] text-stone-300">{hoveredPoint.orderCount} đơn hợp lệ</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs text-stone-500 mb-2">
                {chartMetric !== 'orders' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-full bg-[#8C5D3B]"></span>
                    <span>Doanh thu thuần (VND)</span>
                  </div>
                )}
                {chartMetric !== 'revenue' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#C5A059]/70"></span>
                    <span>Số đơn hàng hợp lệ</span>
                  </div>
                )}
              </div>

              {/* SVG Area, Line & Bar Chart */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[560px]">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-58">
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8C5D3B" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#8C5D3B" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                      const y = chartHeight - paddingY - pct * usableHeight;
                      return (
                        <g key={i}>
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={chartWidth - paddingX}
                            y2={y}
                            stroke="#E7E0D5"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          {chartMetric !== 'orders' && (
                            <text
                              x={paddingX - 8}
                              y={y + 4}
                              textAnchor="end"
                              fontSize="10"
                              fill="#8C827A"
                            >
                              {pct === 0 ? '0' : formatCurrencyVND(maxRevenue * pct).replace('₫', '')}
                            </text>
                          )}
                          {chartMetric !== 'revenue' && (
                            <text
                              x={chartWidth - paddingX + 8}
                              y={y + 4}
                              textAnchor="start"
                              fontSize="10"
                              fill="#C5A059"
                              fontWeight="bold"
                            >
                              {Math.round(maxOrders * pct)} đơn
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Order Count Vertical Bars */}
                    {chartMetric !== 'revenue' &&
                      trendPoints.map((p, idx) => {
                        const { x } = getCoordinates(idx, p.revenue);
                        const barWidth = Math.max(Math.min(usableWidth / (trendPoints.length * 2.8), 20), 8);
                        const barH = getOrderBarHeight(p.orderCount);
                        const barY = chartHeight - paddingY - barH;
                        const isHovered = hoveredPoint?.date === p.date;
                        return (
                          <rect
                            key={`bar-${p.date}`}
                            x={x - barWidth / 2}
                            y={barY}
                            width={barWidth}
                            height={Math.max(barH, 2)}
                            rx="3"
                            fill={isHovered ? '#C5A059' : '#E7D5B0'}
                            opacity={isHovered ? 1 : 0.8}
                            className="transition-all cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(p)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}

                    {/* Revenue Gradient Area */}
                    {chartMetric !== 'orders' && trendPoints.length > 0 && (
                      <polygon
                        points={areaString}
                        fill="url(#revenueGradient)"
                      />
                    )}

                    {/* Revenue Polyline */}
                    {chartMetric !== 'orders' && trendPoints.length > 0 && (
                      <polyline
                        fill="none"
                        stroke="#8C5D3B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pointsString}
                      />
                    )}

                    {/* Interactive Points on Revenue Line */}
                    {chartMetric !== 'orders' &&
                      trendPoints.map((p, idx) => {
                        const { x, y } = getCoordinates(idx, p.revenue);
                        const isHovered = hoveredPoint?.date === p.date;
                        return (
                          <g
                            key={`point-${p.date}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(p)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 7 : 4}
                              fill={isHovered ? '#C5A059' : '#8C5D3B'}
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              className="transition-all"
                            />
                            {/* X-axis date labels */}
                            {(trendPoints.length <= 14 || idx % Math.ceil(trendPoints.length / 10) === 0 || idx === trendPoints.length - 1) && (
                              <text
                                x={x}
                                y={chartHeight - 8}
                                textAnchor="middle"
                                fontSize="10"
                                fill={isHovered ? '#8C5D3B' : '#8C827A'}
                                fontWeight={isHovered ? 'bold' : 'normal'}
                              >
                                {p.formattedDate}
                              </text>
                            )}
                          </g>
                        );
                      })}
                  </svg>
                </div>
              </div>
            </div>

            {/* Accounting Rule Callout */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#F6F4EE] border border-[#E7E0D5] text-xs text-stone-700 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#8C5D3B]">Nguyên tắc ghi nhận doanh thu: </strong>
                {stats?.kpis.revenueRuleDescription}
              </div>
            </div>
          </div>

          {/* Right Column: Order Status & Category Distribution */}
          <div className="space-y-6">
            {/* Order Status Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-[#E7E0D5] shadow-xs">
              <h3 className="font-serif-title font-bold text-base text-[#1C1917] mb-1">
                Cơ Cấu Trạng Thái Đơn Hàng
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Tỉ lệ phần trăm trên tổng {stats?.kpis.totalOrders || 0} đơn hệ thống
              </p>

              <div className="space-y-3">
                {stats?.orderDistribution && stats.orderDistribution.length > 0 ? (
                  stats.orderDistribution.map((item) => (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-700">{item.label}</span>
                        <span className="font-bold text-stone-900">
                          {item.count} đơn ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.status === 'DELIVERED'
                              ? 'bg-emerald-600'
                              : item.status === 'SHIPPING'
                              ? 'bg-indigo-600'
                              : item.status === 'CONFIRMED'
                              ? 'bg-blue-600'
                              : item.status === 'PENDING'
                              ? 'bg-amber-500'
                              : item.status === 'REFUNDED'
                              ? 'bg-purple-600'
                              : 'bg-stone-400'
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-stone-400">
                    Chưa có đơn hàng nào trong cơ sở dữ liệu
                  </div>
                )}
              </div>
            </div>

            {/* Category Revenue Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-[#E7E0D5] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-serif-title font-bold text-base text-[#1C1917]">
                  Doanh Thu Theo Thể Loại Sách
                </h3>
                <Layers className="w-4 h-4 text-[#C5A059]" />
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Phân bổ doanh số của các danh mục trong kỳ
              </p>

              {stats?.categoryDistribution && stats.categoryDistribution.length > 0 ? (
                <div className="space-y-3">
                  {stats.categoryDistribution.slice(0, 5).map((cat, idx) => (
                    <div key={cat.categoryName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-800 truncate pr-2">
                          {cat.categoryName}
                        </span>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-stone-900 mr-2">
                            {formatCurrencyVND(cat.revenue)}
                          </span>
                          <span className="text-[11px] text-stone-500 font-mono">
                            ({cat.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            idx === 0
                              ? 'bg-[#8C5D3B]'
                              : idx === 1
                              ? 'bg-[#C5A059]'
                              : idx === 2
                              ? 'bg-emerald-600'
                              : 'bg-stone-400'
                          }`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-stone-400">
                  Chưa có số liệu danh mục phát sinh doanh thu trong kỳ này
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Warning Alert Banner (If Any) */}
        {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
          <div className="bg-rose-50/70 rounded-2xl p-6 border border-rose-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title font-bold text-base text-rose-950">
                    Cảnh Báo Tồn Kho Thấp ({stats.lowStockAlerts.length} đầu sách)
                  </h3>
                  <p className="text-xs text-rose-800">
                    Các đầu sách có số lượng khả dụng thấp hơn hoặc bằng mức ngưỡng an toàn
                  </p>
                </div>
              </div>

              <Link
                to="/admin/inventory"
                className="text-xs font-bold text-rose-800 hover:text-rose-950 hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                Nhập kho bổ sung ngay <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3 border border-rose-200/80 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{item.bookTitle}</p>
                    <p className="text-[11px] text-stone-500 font-mono">ISBN: {item.isbn || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-700 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                      Còn {item.availableQuantity} cuốn
                    </span>
                    <p className="text-[10px] text-stone-400 mt-0.5">Ngưỡng: {item.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Section: Top Best-Selling Books & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Books */}
          <div className="bg-white rounded-2xl p-6 border border-[#E7E0D5] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif-title font-bold text-lg text-[#1C1917]">
                  Top Sách Bán Chạy Nhất
                </h3>
                <p className="text-xs text-stone-500">
                  Xếp hạng dựa trên số lượng phát hành thực tế từ các đơn thành công
                </p>
              </div>
              <Link
                to="/admin/books"
                className="text-xs font-semibold text-[#8C5D3B] hover:underline inline-flex items-center gap-1"
              >
                Xem kho sách <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats?.topSellingBooks && stats.topSellingBooks.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {stats.topSellingBooks.map((book, index) => (
                  <div key={book.bookId} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          index === 0
                            ? 'bg-[#C5A059] text-[#1C1917] shadow-xs'
                            : index === 1
                            ? 'bg-stone-300 text-stone-800'
                            : index === 2
                            ? 'bg-amber-700/20 text-amber-900'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        #{index + 1}
                      </div>

                      <img
                        src={book.coverImage || FALLBACK_COVER}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded shadow-xs shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_COVER;
                        }}
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{book.title}</p>
                        <p className="text-[11px] text-stone-500">
                          Đã phát hành: <strong className="text-stone-800">{book.totalSold} quyển</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-800">
                        {formatCurrencyVND(book.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-stone-400">
                Chưa có dữ liệu sách bán ra từ các đơn đã xác nhận
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-6 border border-[#E7E0D5] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif-title font-bold text-lg text-[#1C1917]">
                  Đơn Hàng Gần Đây
                </h3>
                <p className="text-xs text-stone-500">Các đơn mới nhất cần kiểm tra và xử lý vận chuyển</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-semibold text-[#8C5D3B] hover:underline inline-flex items-center gap-1"
              >
                Quản lý tất cả đơn <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-bold text-[#8C5D3B] hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-stone-600 truncate mt-0.5">
                        {order.receiverName} • {order.items.length} món sách
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-stone-900">{formatCurrencyVND(order.totalAmount)}</p>
                      <p className="text-[10px] text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-stone-400">
                Chưa có đơn hàng nào trong hệ thống
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
