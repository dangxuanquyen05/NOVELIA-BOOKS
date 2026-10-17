import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminDashboardService } from '../../services/adminDashboardService';
import type { DashboardStats, RevenueTrendPoint } from '../../types/adminDashboard';
import { formatCurrencyVND } from '../../utils/format';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
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
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

type PresetTimeRange = 1 | 7 | 30 | 90 | 'custom';

export const AdminDashboardPage: React.FC = () => {
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

  // Export CSV report with UTF-8 BOM
  const handleExportCSV = () => {
    if (!stats) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csvContent += 'BÁO CÁO THỐNG KÊ KINH DOANH - NOVELIA BOOKS\n';
    csvContent += `Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

    csvContent += '1. CHỈ SỐ KPI CHÍNH\n';
    csvContent += `Doanh thu thuần trong kỳ,${stats.kpis.periodRevenue || 0} VND\n`;
    csvContent += `Doanh thu hôm nay,${stats.kpis.todayRevenue || 0} VND\n`;
    csvContent += `Tổng doanh thu lũy kế,${stats.kpis.totalRevenue || 0} VND\n`;
    csvContent += `Tổng giá trị đơn hàng phát sinh,${stats.kpis.grossOrderValue || 0} VND\n`;
    csvContent += `Lợi nhuận gộp ước tính,${stats.kpis.estimatedNetProfit || 0} VND\n`;
    csvContent += `Tổng số đơn toàn thời gian,${stats.kpis.totalOrders}\n`;
    csvContent += `Số đơn phát sinh trong kỳ,${stats.kpis.periodOrders || 0}\n`;
    csvContent += `Số đơn chờ xử lý,${stats.kpis.pendingOrdersCount}\n`;
    csvContent += `Số khách hàng độc giả,${stats.kpis.totalCustomers}\n`;
    csvContent += `Tổng số đầu sách,${stats.kpis.totalBooks}\n`;
    csvContent += `Số sách cảnh báo tồn kho,${stats.kpis.lowStockBooksCount}\n\n`;

    csvContent += '2. XU HƯỚNG DOANH THU THEO NGÀY\n';
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

  // Tính toán kích thước và tọa độ cho SVG Chart
  const trendPoints = stats?.revenueTrend || [];
  const maxRevenue = Math.max(...trendPoints.map((p) => p.revenue), 1000000);
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / Math.max(trendPoints.length - 1, 1)) * usableWidth;
    const y = chartHeight - paddingY - (val / maxRevenue) * usableHeight;
    return { x, y };
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">Đã hoàn tiền</span>;
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
      title="Tổng Quan Vận Hành Nhà Sách"
      subtitle="Báo cáo phân tích doanh thu, cơ cấu đơn hàng và quản trị kho sách thực tế"
    >
      <div className="space-y-8">
        {/* Top Control Bar: Filters & Actions */}
        <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Preset Buttons */}
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
                      ? 'bg-[#1B3B2B] text-white shadow-xs'
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
                  className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B3B2B]"
                />
                <span className="text-xs text-stone-400">đến</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B3B2B]"
                />
                <Button size="sm" variant="primary" onClick={handleApplyCustomDate}>
                  Áp dụng
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              disabled={!stats}
              leftIcon={<Download className="w-3.5 h-3.5 text-[#1B3B2B]" />}
            >
              Xuất báo cáo CSV
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
              className="font-bold underline text-xs text-rose-900 hover:text-rose-700 ml-4"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Primary KPI Cards Grid (6 cards) */}
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
              {loading && !stats ? '...' : formatCurrencyVND(stats?.kpis.periodRevenue || 0)}
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

          {/* Card 2: Tổng Doanh Thu Lũy Kế */}
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
              {loading && !stats ? '...' : formatCurrencyVND(stats?.kpis.totalRevenue || 0)}
            </div>
            <p className="mt-2.5 text-[11px] text-stone-400">
              Toàn bộ đơn hàng đã xác nhận thành công
            </p>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1 text-[11px] text-stone-400">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              <span className="truncate">Chuẩn kế toán nhà sách</span>
            </div>
          </div>

          {/* Card 3: Tổng Giá Trị Đơn Hàng (Gross Order Value) */}
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Tổng Giá Trị Đơn
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif-title text-xl font-bold text-[#1C1917]">
              {loading && !stats ? '...' : formatCurrencyVND(stats?.kpis.grossOrderValue || 0)}
            </div>
            <p className="mt-2.5 text-[11px] text-stone-500">
              Bao gồm cả đơn đang duyệt & đơn hủy
            </p>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span>Đơn trong kỳ:</span>
              <span className="font-semibold text-stone-800">{stats?.kpis.periodOrders || 0} đơn</span>
            </div>
          </div>

          {/* Card 4: Lợi Nhuận Gộp Ước Tính */}
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Lợi Nhuận Ước Tính
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif-title text-xl font-bold text-[#1C1917]">
              {loading && !stats ? '...' : formatCurrencyVND(stats?.kpis.estimatedNetProfit || 0)}
            </div>
            <p className="mt-2.5 text-[11px] text-stone-500">
              Ước tính theo biên lợi nhuận sách (35%)
            </p>
            <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
              <span>Từ doanh thu hợp lệ</span>
            </div>
          </div>

          {/* Card 5: Đơn Hàng & Chờ Xử Lý */}
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Đơn Hàng Chờ Xử Lý
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif-title text-xl font-bold text-amber-900">
              {loading && !stats ? '...' : `${stats?.kpis.pendingOrdersCount || 0} đơn`}
            </div>
            <p className="mt-2.5 text-[11px] text-stone-500">
              Tổng số {stats?.kpis.totalOrders || 0} đơn đã tạo
            </p>
            <div className="mt-3 pt-3 border-t border-stone-100">
              <Link to="/admin/orders?status=PENDING" className="text-[11px] font-semibold text-[#1B3B2B] hover:underline inline-flex items-center gap-1">
                Duyệt đơn ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 6: Độc Giả & Tồn Kho */}
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Độc Giả & Tồn Kho
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif-title text-xl font-bold text-[#1C1917]">
              {loading && !stats ? '...' : `${stats?.kpis.totalCustomers || 0} độc giả`}
            </div>
            <div className="mt-2.5">
              {(stats?.kpis.lowStockBooksCount || 0) > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  {stats?.kpis.lowStockBooksCount} sách sắp hết
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> Kho sách an toàn
                </span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <Link to="/admin/customers" className="font-semibold text-[#1B3B2B] hover:underline">
                Khách hàng
              </Link>
              <Link to="/admin/inventory" className="font-semibold text-[#1B3B2B] hover:underline">
                Kho hàng
              </Link>
            </div>
          </div>
        </div>

        {/* Charts Section: Revenue Trend & Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main SVG Revenue Trend Chart (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E7E0D5] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-serif-title font-bold text-lg text-[#1C1917] flex items-center gap-2">
                    <span>Biểu Đồ Xu Hướng Doanh Thu</span>
                    <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {trendPoints.length} ngày hiển thị
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Số liệu doanh thu thuần từ các đơn hàng hợp lệ đã thanh toán/xác nhận
                  </p>
                </div>

                {hoveredPoint && (
                  <div className="text-right bg-[#1B3B2B] text-white px-3.5 py-1.5 rounded-xl shadow-md border border-[#2C4F3B]">
                    <p className="text-xs font-bold text-[#E7C980]">
                      {hoveredPoint.formattedDate} ({hoveredPoint.date}): {formatCurrencyVND(hoveredPoint.revenue)}
                    </p>
                    <p className="text-[10px] text-stone-300">{hoveredPoint.orderCount} đơn bán thành công</p>
                  </div>
                )}
              </div>

              {/* SVG Area & Line Chart */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[540px]">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56">
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1B3B2B" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1B3B2B" stopOpacity="0.0" />
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
                          <text
                            x={paddingX - 8}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#8C827A"
                          >
                            {pct === 0 ? '0' : formatCurrencyVND(maxRevenue * pct).replace('₫', '')}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Area */}
                    {trendPoints.length > 0 && (
                      <polygon
                        points={areaString}
                        fill="url(#revenueGradient)"
                      />
                    )}

                    {/* Polyline */}
                    {trendPoints.length > 0 && (
                      <polyline
                        fill="none"
                        stroke="#1B3B2B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pointsString}
                      />
                    )}

                    {/* Interactive Points */}
                    {trendPoints.map((p, idx) => {
                      const { x, y } = getCoordinates(idx, p.revenue);
                      const isHovered = hoveredPoint?.date === p.date;
                      return (
                        <g
                          key={p.date}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 7 : 4}
                            fill={isHovered ? '#C5A059' : '#1B3B2B'}
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="transition-all"
                          />
                          {/* Only show dates for selected interval or when hovered */}
                          {(trendPoints.length <= 14 || idx % Math.ceil(trendPoints.length / 10) === 0 || idx === trendPoints.length - 1) && (
                            <text
                              x={x}
                              y={chartHeight - 8}
                              textAnchor="middle"
                              fontSize="10"
                              fill={isHovered ? '#1B3B2B' : '#8C827A'}
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
                <strong className="text-[#1B3B2B]">Nguyên tắc ghi nhận doanh thu: </strong>
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
                              ? 'bg-[#1B3B2B]'
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
                    Các đầu sách có số lượng khả dụng thấp hơn mức ngưỡng quy định (Low Stock Threshold)
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
                className="text-xs font-semibold text-[#1B3B2B] hover:underline inline-flex items-center gap-1"
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
                            ? 'bg-[#C5A059] text-[#1B3B2B] shadow-xs'
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
                className="text-xs font-semibold text-[#1B3B2B] hover:underline inline-flex items-center gap-1"
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
                          className="font-mono text-xs font-bold text-[#1B3B2B] hover:underline"
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
