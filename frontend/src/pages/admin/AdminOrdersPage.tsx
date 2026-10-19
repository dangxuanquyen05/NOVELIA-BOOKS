import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
  RotateCcw,
  X,
  CreditCard,
  User,
  RefreshCw,
  History,
  FileText,
  MapPin,
  Mail,
  Phone,
  Tag,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { adminOrderService } from '../../services/adminOrderService';
import { adminShipmentService } from '../../services/adminShipmentService';
import type { Order, OrderStatus } from '../../types/order';
import type { Shipment, ShippingStatus, ShippingFeeCalculateResult } from '../../types/shipment';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { AdminLayout } from '../../components/admin/AdminLayout';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Update Status Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Update Payment Status Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [targetPaymentStatus, setTargetPaymentStatus] = useState<string>('PAID');
  const [paymentTxCode, setPaymentTxCode] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Shipment State in Order Details (Phase 9 - GHN Carrier Integration)
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null);
  const [isLoadingShipment, setIsLoadingShipment] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [updateShipmentModalOpen, setUpdateShipmentModalOpen] = useState(false);
  const [targetShipmentStatus, setTargetShipmentStatus] = useState<ShippingStatus>('PENDING');
  const [shipmentNote, setShipmentNote] = useState('');
  const [isSubmittingShipment, setIsSubmittingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [isTrackingCopied, setIsTrackingCopied] = useState(false);

  // Quick Fee Calculator State in Order Details
  const [calculatedFeeInfo, setCalculatedFeeInfo] = useState<ShippingFeeCalculateResult | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; isError?: boolean }>({
    show: false,
    message: '',
  });

  const showToast = (message: string, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentMethodFilter, paymentStatusFilter, startDateFilter, endDateFilter, keyword, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const pmParam = paymentMethodFilter === 'ALL' ? undefined : paymentMethodFilter;
      const psParam = paymentStatusFilter === 'ALL' ? undefined : paymentStatusFilter;
      const startParam = startDateFilter ? `${startDateFilter}T00:00:00` : undefined;
      const endParam = endDateFilter ? `${endDateFilter}T23:59:59` : undefined;

      const res = await adminOrderService.getAllOrders({
        status: statusParam,
        keyword: keyword || undefined,
        paymentMethod: pmParam,
        paymentStatus: psParam,
        startDate: startParam,
        endDate: endParam,
        page,
        size: 10,
      });
      setOrders(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách đơn hàng', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setKeyword('');
    setStatusFilter('ALL');
    setPaymentMethodFilter('ALL');
    setPaymentStatusFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
    setPage(0);
  };

  const loadOrderShipment = async (orderId: number) => {
    setIsLoadingShipment(true);
    try {
      const sh = await adminShipmentService.getShipmentByOrderId(orderId);
      setCurrentShipment(sh);
    } catch {
      setCurrentShipment(null);
    } finally {
      setIsLoadingShipment(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedOrder) return;
    setIsCreatingShipment(true);
    try {
      const created = await adminShipmentService.createShipment({
        orderId: selectedOrder.id,
        carrierName: 'GiaoHangNhanh',
        note: 'Khởi tạo từ bảng điều khiển quản trị Novelia',
      });
      setCurrentShipment(created);
      showToast('Đã khởi tạo tiến trình vận chuyển qua Giao Hàng Nhanh (GHN) thành công');
      const freshOrder = await adminOrderService.getOrderDetail(selectedOrder.orderNumber);
      setSelectedOrder(freshOrder);
      await loadOrders();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tạo vận đơn GHN', true);
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const handleOpenUpdateShipmentModal = () => {
    if (!currentShipment) return;
    setTargetShipmentStatus(currentShipment.shippingStatus);
    setShipmentNote(currentShipment.note || '');
    setShipmentError(null);
    setUpdateShipmentModalOpen(true);
  };

  const handleConfirmShipmentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShipment) return;
    setIsSubmittingShipment(true);
    setShipmentError(null);
    try {
      const updated = await adminShipmentService.updateStatus(currentShipment.id, {
        shippingStatus: targetShipmentStatus,
        note: shipmentNote.trim() || undefined,
      });
      setCurrentShipment(updated);
      showToast(`Đã cập nhật trạng thái vận đơn sang ${targetShipmentStatus}`);
      setUpdateShipmentModalOpen(false);
      if (selectedOrder) {
        const freshOrder = await adminOrderService.getOrderDetail(selectedOrder.orderNumber);
        setSelectedOrder(freshOrder);
      }
      await loadOrders();
    } catch (err: any) {
      setShipmentError(err.response?.data?.message || 'Không thể cập nhật trạng thái vận đơn');
    } finally {
      setIsSubmittingShipment(false);
    }
  };

  const handleQuickCalculateFee = async () => {
    if (!selectedOrder) return;
    setIsCalculatingFee(true);
    try {
      const res = await adminShipmentService.calculateFee({
        toProvince: selectedOrder.shippingAddress,
        orderAmount: selectedOrder.subtotal,
        weightGrams: 500,
      });
      setCalculatedFeeInfo(res);
    } catch {
      showToast('Không thể ước tính cước GHN lúc này', true);
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handleCopyTrackingNumber = (trackingCode: string) => {
    navigator.clipboard.writeText(trackingCode);
    setIsTrackingCopied(true);
    setTimeout(() => setIsTrackingCopied(false), 2000);
  };

  // Xem chi tiết đơn hàng (tải lại dữ liệu mới nhất để lấy timeline & shipment)
  const handleOpenDetailModal = async (order: Order) => {
    setSelectedOrder(order);
    setIsLoadingDetail(true);
    setCurrentShipment(null);
    setCalculatedFeeInfo(null);
    loadOrderShipment(order.id);
    try {
      const freshOrder = await adminOrderService.getOrderDetail(order.orderNumber);
      setSelectedOrder(freshOrder);
    } catch {
      // nếu lỗi mạng giữ order hiện tại
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Mở modal cập nhật trạng thái đơn hàng
  const handleOpenUpdateModal = (order: Order, newStatus: string) => {
    setUpdatingOrder(order);
    setTargetStatus(newStatus);
    setAdminNote('');
    setUpdateError(null);
    setUpdateModalOpen(true);
  };

  // Xác nhận cập nhật trạng thái đơn hàng
  const handleConfirmStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrder || !targetStatus) return;

    if (targetStatus === 'CANCELLED' && !adminNote.trim()) {
      setUpdateError('Vui lòng nhập lý do hủy đơn hàng để lưu vết kiểm toán');
      return;
    }

    setIsSubmitting(true);
    setUpdateError(null);

    try {
      const updated = await adminOrderService.updateOrderStatus(
        updatingOrder.orderNumber,
        targetStatus,
        adminNote.trim() || undefined
      );

      showToast(
        `Đã chuyển trạng thái đơn hàng ${updated.orderNumber} sang ${targetStatus}${
          targetStatus === 'CANCELLED' ? ' (Tồn kho đã được hoàn lại an toàn)' : ''
        }`
      );

      setUpdateModalOpen(false);
      setUpdatingOrder(null);
      if (selectedOrder && selectedOrder.orderNumber === updated.orderNumber) {
        setSelectedOrder(updated);
      }
      await loadOrders();
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal cập nhật trạng thái thanh toán riêng biệt
  const handleOpenPaymentModal = (order: Order) => {
    setPayingOrder(order);
    setTargetPaymentStatus(order.paymentStatus === 'PAID' ? 'REFUNDED' : 'PAID');
    setPaymentTxCode(order.paymentTransactionCode || '');
    setPaymentNote('');
    setPaymentError(null);
    setPaymentModalOpen(true);
  };

  // Xác nhận cập nhật trạng thái thanh toán
  const handleConfirmPaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingOrder || !targetPaymentStatus) return;

    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      const updated = await adminOrderService.updatePaymentStatus(
        payingOrder.orderNumber,
        targetPaymentStatus,
        paymentTxCode.trim() || undefined,
        paymentNote.trim() || undefined
      );

      showToast(`Đã cập nhật trạng thái thanh toán cho đơn ${updated.orderNumber} thành ${targetPaymentStatus}`);
      setPaymentModalOpen(false);
      setPayingOrder(null);
      if (selectedOrder && selectedOrder.orderNumber === updated.orderNumber) {
        setSelectedOrder(updated);
      }
      await loadOrders();
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Không thể cập nhật trạng thái thanh toán');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const renderStatusBadge = (status: OrderStatus | string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ Xác Nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Đã Xác Nhận
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Truck className="w-3.5 h-3.5 text-purple-600" /> Đang Giao Hàng
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Giao Thành Công
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
            <XCircle className="w-3.5 h-3.5 text-stone-500" /> Đã Hủy
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Đã Hoàn Tiền
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const renderPaymentBadge = (method: string, status?: string) => {
    const isPaid = status === 'PAID';
    const isRefunded = status === 'REFUNDED';
    const isFailed = status === 'FAILED';

    let colorCls = 'bg-amber-50 text-amber-800 border-amber-200';
    let statusText = 'Chưa thanh toán';

    if (isPaid) {
      colorCls = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      statusText = 'Đã thanh toán';
    } else if (isRefunded) {
      colorCls = 'bg-rose-50 text-rose-800 border-rose-200';
      statusText = 'Đã hoàn tiền';
    } else if (isFailed) {
      colorCls = 'bg-red-50 text-red-800 border-red-200';
      statusText = 'Thất bại';
    }

    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
          <CreditCard className="w-2.5 h-2.5" /> {method || 'COD'}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorCls}`}>
          {isPaid && <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />}
          {statusText}
        </span>
      </div>
    );
  };

  // Tính thống kê nhanh từ danh sách hiện tại
  const countPending = orders.filter((o) => o.status === 'PENDING').length;
  const countShipping = orders.filter((o) => o.status === 'SHIPPING').length;
  const countDelivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const countCancelled = orders.filter((o) => o.status === 'CANCELLED').length;

  return (
    <AdminLayout
      title="Quản Lý Đơn Hàng"
      subtitle={`Theo dõi, điều phối vận chuyển và kiểm soát thanh toán cho ${totalElements} đơn hàng trong hệ thống`}
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-sm font-medium border animate-slide-up ${
              toast.isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {toast.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Chờ Xác Nhận</p>
              <p className="text-lg font-bold text-[#1C1917]">{countPending}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Đang Vận Chuyển</p>
              <p className="text-lg font-bold text-[#1C1917]">{countShipping}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Giao Thành Công</p>
              <p className="text-lg font-bold text-[#1C1917]">{countDelivered}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Đã Hủy / Hoàn</p>
              <p className="text-lg font-bold text-[#1C1917]">{countCancelled}</p>
            </div>
          </div>
        </div>

        {/* Search & Advanced Filters */}
        <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo mã đơn (NOV-...), tên khách, số điện thoại, email..."
                className="w-full text-xs rounded-xl border border-[#D5CDC0] pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Tìm Kiếm
            </Button>
            {(keyword || statusFilter !== 'ALL' || paymentMethodFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || startDateFilter || endDateFilter) && (
              <Button type="button" variant="outline" size="md" onClick={handleResetFilters}>
                Xóa Bộ Lọc
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={loadOrders}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Làm Mới
            </Button>
          </form>

          {/* Secondary filter selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#F0EBE3]">
            {/* Phương thức thanh toán */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Phương thức TT
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full text-xs rounded-xl border border-[#D5CDC0] px-3 py-2 bg-[#FAFAF8] focus:outline-none focus:border-[#8C5D3B]"
              >
                <option value="ALL">Tất cả phương thức</option>
                <option value="COD">Thanh toán khi nhận (COD)</option>
                <option value="VNPAY">VNPAY</option>
                <option value="BANK_TRANSFER">Chuyển khoản Ngân Hàng</option>
              </select>
            </div>

            {/* Trạng thái thanh toán */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Tình trạng TT
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full text-xs rounded-xl border border-[#D5CDC0] px-3 py-2 bg-[#FAFAF8] focus:outline-none focus:border-[#8C5D3B]"
              >
                <option value="ALL">Tất cả tình trạng TT</option>
                <option value="UNPAID">Chưa thanh toán (UNPAID)</option>
                <option value="PAID">Đã thanh toán (PAID)</option>
                <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
                <option value="FAILED">Thanh toán thất bại (FAILED)</option>
              </select>
            </div>

            {/* Từ ngày */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Từ ngày đặt
              </label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full text-xs rounded-xl border border-[#D5CDC0] px-3 py-2 bg-[#FAFAF8] focus:outline-none focus:border-[#8C5D3B]"
              />
            </div>

            {/* Đến ngày */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Đến ngày đặt
              </label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full text-xs rounded-xl border border-[#D5CDC0] px-3 py-2 bg-[#FAFAF8] focus:outline-none focus:border-[#8C5D3B]"
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0EBE3]">
            {[
              { label: 'Tất Cả', value: 'ALL' },
              { label: 'Chờ Xác Nhận (PENDING)', value: 'PENDING' },
              { label: 'Đã Xác Nhận (CONFIRMED)', value: 'CONFIRMED' },
              { label: 'Đang Giao (SHIPPING)', value: 'SHIPPING' },
              { label: 'Đã Giao (DELIVERED)', value: 'DELIVERED' },
              { label: 'Đã Hủy (CANCELLED)', value: 'CANCELLED' },
              { label: 'Đã Hoàn Tiền (REFUNDED)', value: 'REFUNDED' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === tab.value
                    ? 'bg-[#8C5D3B] text-white shadow-xs'
                    : 'bg-[#FAFAF8] text-stone-600 border border-[#E7E0D5] hover:border-stone-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#8C5D3B]/20 border-t-[#8C5D3B] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-500">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500">Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.</p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7FAF8] border-b border-[#E7E0D5] text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Mã Đơn / Ngày Đặt</th>
                    <th className="py-3.5 px-4">Khách Hàng & Giao Hàng</th>
                    <th className="py-3.5 px-4">Tác Phẩm Mua</th>
                    <th className="py-3.5 px-4 text-right">Tổng Tiền</th>
                    <th className="py-3.5 px-4">Thanh Toán</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái Đơn</th>
                    <th className="py-3.5 px-4 text-center">Thao Tác Hợp Lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE3]">
                  {orders.map((order) => {
                    const recipient = order.receiverName || order.recipientName || 'Khách vãng lai';
                    const phone = order.receiverPhone || order.recipientPhone || 'Chưa có SĐT';

                    return (
                      <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Code & Date */}
                        <td className="py-3.5 px-4 space-y-1">
                          <span className="font-mono font-bold text-[#8C5D3B] block text-xs">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] text-stone-400 block">
                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </span>
                          {order.inventoryRestored && (
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200">
                              Đã Hoàn Kho
                            </span>
                          )}
                        </td>

                        {/* Customer & Address */}
                        <td className="py-3.5 px-4 space-y-0.5 max-w-[200px]">
                          <span className="font-bold text-[#1C1917] block truncate">{recipient}</span>
                          <span className="text-stone-500 font-mono block text-[11px]">{phone}</span>
                          {order.userEmail && (
                            <span className="text-stone-400 text-[10px] block truncate">{order.userEmail}</span>
                          )}
                          <span className="text-stone-400 text-[10px] truncate block" title={order.shippingAddress}>
                            {order.shippingAddress}
                          </span>
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <span className="text-[#1C1917] font-medium block truncate">
                            {order.items?.[0]?.bookTitle || 'Không có tên sách'}
                          </span>
                          {order.items && order.items.length > 1 && (
                            <span className="text-[10px] text-stone-400">
                              + {order.items.length - 1} tác phẩm khác
                            </span>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 text-right space-y-0.5">
                          <span className="font-mono font-bold text-[#8C5D3B] block text-xs">
                            {formatCurrencyVND(order.totalAmount)}
                          </span>
                          {order.discountAmount && order.discountAmount > 0 ? (
                            <span className="text-[10px] text-emerald-600 block">
                              Giảm: {formatCurrencyVND(order.discountAmount)}
                            </span>
                          ) : null}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4">
                          {renderPaymentBadge(order.paymentMethod, order.paymentStatus)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(order.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(order)}
                              className="p-1.5 rounded-lg border border-stone-200 hover:bg-white text-stone-600 hover:text-[#8C5D3B]"
                              title="Xem chi tiết đơn & lịch sử"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút cập nhật thanh toán riêng */}
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(order)}
                              className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-800"
                              title="Cập nhật trạng thái thanh toán riêng"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>

                            {/* Luồng chuyển trạng thái hợp lệ theo State Machine */}
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdateModal(order, 'CONFIRMED')}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
                                >
                                  Xác Nhận
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdateModal(order, 'CANCELLED')}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                >
                                  Hủy Đơn
                                </button>
                              </>
                            )}

                            {order.status === 'CONFIRMED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdateModal(order, 'SHIPPING')}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
                                >
                                  Bàn Giao Vận Chuyển
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdateModal(order, 'CANCELLED')}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                >
                                  Hủy Đơn
                                </button>
                              </>
                            )}

                            {order.status === 'SHIPPING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdateModal(order, 'DELIVERED')}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                >
                                  Giao Thành Công
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdateModal(order, 'CANCELLED')}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                >
                                  Hủy / Hoàn Hàng
                                </button>
                              </>
                            )}

                            {order.status === 'DELIVERED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenUpdateModal(order, 'REFUNDED')}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                              >
                                Đổi Trả / Hoàn Tiền
                              </button>
                            )}

                            {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
                              <span className="text-[10px] text-stone-400 italic">Đã kết thúc</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#E7E0D5] bg-[#FDFBF7] text-xs">
              <span className="text-stone-500">
                Hiển thị trang <strong>{page + 1}</strong> / {totalPages} (Tổng số {totalElements} đơn hàng)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 border border-[#E7E0D5] z-10 max-h-[90vh] overflow-y-auto animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88E52]">
                    Chi Tiết Đơn Hàng & Lịch Sử
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <h3 className="font-mono font-bold text-lg sm:text-xl text-[#8C5D3B]">
                      {selectedOrder.orderNumber}
                    </h3>
                    {renderStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4 Cards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Khách hàng */}
                <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E7E0D5] space-y-2">
                  <span className="font-bold text-stone-700 block flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <User className="w-3.5 h-3.5 text-[#B88E52]" /> Người Nhận Hàng
                  </span>
                  <p className="font-bold text-[#1C1917] text-sm">
                    {selectedOrder.receiverName || selectedOrder.recipientName}
                  </p>
                  <p className="font-mono text-stone-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    {selectedOrder.receiverPhone || selectedOrder.recipientPhone}
                  </p>
                  {selectedOrder.userEmail && (
                    <p className="text-stone-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-stone-400" />
                      {selectedOrder.userEmail}
                    </p>
                  )}
                  <p className="text-stone-600 flex items-start gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                    <span>{selectedOrder.shippingAddress}</span>
                  </p>
                </div>

                {/* 2. Thanh toán & Trạng thái */}
                <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E7E0D5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                      <CreditCard className="w-3.5 h-3.5 text-[#B88E52]" /> Thông Tin Thanh Toán
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPaymentModal(selectedOrder)}
                      className="text-[10px] font-semibold text-[#8C5D3B] hover:underline"
                    >
                      Cập nhật TT
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-stone-500">Phương thức:</span>
                    <span className="font-bold text-[#1C1917]">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Tình trạng:</span>
                    <span className="font-semibold">
                      {selectedOrder.paymentStatus === 'PAID' ? (
                        <span className="text-emerald-700">Đã thanh toán</span>
                      ) : selectedOrder.paymentStatus === 'REFUNDED' ? (
                        <span className="text-rose-700">Đã hoàn tiền</span>
                      ) : selectedOrder.paymentStatus === 'FAILED' ? (
                        <span className="text-red-700">Thất bại</span>
                      ) : (
                        <span className="text-amber-700">Chưa thanh toán</span>
                      )}
                    </span>
                  </div>
                  {selectedOrder.paymentTransactionCode && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Mã giao dịch:</span>
                      <span className="font-mono text-stone-700">{selectedOrder.paymentTransactionCode}</span>
                    </div>
                  )}
                  {selectedOrder.paidAt && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Ngày thanh toán:</span>
                      <span className="text-stone-600">{new Date(selectedOrder.paidAt).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Tiến trình Vận Chuyển & Đấu Nối Giao Hàng Nhanh (GHN) - Phase 9 */}
              <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E7E0D5] space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E7E0D5]">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#B88E52]" />
                    <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wide">
                      Tiến Trình Vận Chuyển • GHN Carrier Framework
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentShipment ? (
                      <>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E6] text-[#8C5D3B] border border-[#D5E4D8]">
                          {currentShipment.shippingStatus}
                        </span>
                        {currentShipment.liveCarrierConnected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            GHN Live API
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Khung Chuẩn Bị (Sandbox)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                        Chưa khởi tạo vận đơn
                      </span>
                    )}
                  </div>
                </div>

                {isLoadingShipment ? (
                  <div className="py-4 text-center text-stone-400 italic">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                    Đang tải dữ liệu vận đơn...
                  </div>
                ) : currentShipment ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-stone-500 block text-[11px]">Đơn vị vận chuyển:</span>
                        <strong className="text-[#1C1917] font-semibold">{currentShipment.shippingCarrier}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[11px]">Dự kiến giao:</span>
                        <span className="text-stone-700">
                          {currentShipment.estimatedDelivery
                            ? new Date(currentShipment.estimatedDelivery).toLocaleDateString('vi-VN')
                            : '1-3 ngày làm việc'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[11px] mb-1">Mã vận đơn bưu cục:</span>
                      {currentShipment.trackingNumber ? (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 w-fit">
                          <span className="font-mono font-bold text-sm text-[#8C5D3B]">
                            {currentShipment.trackingNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTrackingNumber(currentShipment.trackingNumber!)}
                            className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-700"
                            title="Sao chép mã vận đơn"
                          >
                            {isTrackingCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <strong>Chưa cấp mã vận đơn</strong>: Khung chuẩn bị tích hợp GHN đang chờ cấu hình Live Token & Shop ID. Hệ thống tuân thủ nguyên tắc <em>không tạo mã vận đơn giả</em> để bảo toàn tính toàn vẹn dữ liệu.
                          </div>
                        </div>
                      )}
                    </div>

                    {currentShipment.note && (
                      <p className="text-[11px] text-stone-600 bg-white p-2 rounded-xl border border-stone-200">
                        <strong className="text-stone-700">Ghi chú bưu tá:</strong> {currentShipment.note}
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap gap-2 border-t border-[#E7E0D5]">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenUpdateShipmentModal}
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        Cập Nhật Trạng Thái Giao Hàng
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleQuickCalculateFee}
                        isLoading={isCalculatingFee}
                      >
                        <Calculator className="w-3.5 h-3.5 mr-1" />
                        Tra Cứu Cước GHN Đơn Này
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-stone-600">
                      Đơn hàng chưa có bản ghi vận đơn GHN. Bạn có thể khởi tạo tiến trình giao bưu cục ngay để theo dõi hành trình giao nhận.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={isCreatingShipment}
                        onClick={handleCreateShipment}
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        Khởi Tạo Tiến Trình Vận Chuyển GHN
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={isCalculatingFee}
                        onClick={handleQuickCalculateFee}
                      >
                        <Calculator className="w-3.5 h-3.5 mr-1" />
                        Ước Tính Cước Bưu Cục GHN
                      </Button>
                    </div>
                  </div>
                )}

                {/* Box hiển thị kết quả tính cước GHN */}
                {calculatedFeeInfo && (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-[#D5E4D8] space-y-1.5 text-[11px] animate-fade-in">
                    <div className="flex items-center justify-between font-bold text-[#8C5D3B]">
                      <span>Ước tính cước ({calculatedFeeInfo.carrierName}):</span>
                      <span className="font-mono text-xs">{formatCurrencyVND(calculatedFeeInfo.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Cước gốc / Thời gian dự kiến:</span>
                      <span>{formatCurrencyVND(calculatedFeeInfo.originalFee)} • ~{calculatedFeeInfo.estimatedDays} ngày</span>
                    </div>
                    {calculatedFeeInfo.isFreeShipping && (
                      <div className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Miễn phí giao hàng toàn quốc (Đơn từ 500.000 đ)
                      </div>
                    )}
                    <p className="text-[10px] text-stone-400 italic pt-1 border-t border-stone-100">
                      {calculatedFeeInfo.notice}
                    </p>
                  </div>
                )}
              </div>

              {/* Note nếu có */}
              {selectedOrder.note && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wide">Ghi chú đơn hàng:</strong>
                    <span>{selectedOrder.note}</span>
                  </div>
                </div>
              )}

              {/* Danh sách sản phẩm mua */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#B88E52]" /> Danh Sách Tác Phẩm Mua (
                  {selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-[#F0EBE3] border border-[#E7E0D5] rounded-2xl overflow-hidden">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between bg-white text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.coverImageUrl || FALLBACK_COVER}
                          alt={item.bookTitle}
                          className="w-10 h-14 object-cover rounded-md border border-[#E7E0D5]"
                        />
                        <div>
                          <p className="font-bold text-[#1C1917] line-clamp-1">{item.bookTitle}</p>
                          <p className="text-[11px] text-stone-500">
                            Đơn giá: {formatCurrencyVND(item.unitPrice || item.price || 0)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#8C5D3B]">
                        {formatCurrencyVND(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E7E0D5] space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tạm tính tiền sách:</span>
                  <span className="font-mono font-medium">{formatCurrencyVND(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Phí vận chuyển tiêu chuẩn:</span>
                  <span className="font-mono font-medium">{formatCurrencyVND(selectedOrder.shippingFee)}</span>
                </div>
                {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Giảm giá khuyến mãi ({selectedOrder.couponCode || 'Mã giảm'}):
                    </span>
                    <span className="font-mono font-medium">-{formatCurrencyVND(selectedOrder.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-bold text-[#8C5D3B] pt-2 border-t border-[#E7E0D5]">
                  <span>Tổng tiền thanh toán (COD / Chuyển khoản):</span>
                  <span className="font-mono text-base">{formatCurrencyVND(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Timeline Lịch sử chuyển trạng thái (Audit Trail) */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#B88E52]" /> Nhật Ký Chuyển Trạng Thái & Thao Tác
                </h4>

                {isLoadingDetail ? (
                  <p className="text-xs text-stone-400 italic">Đang tải nhật ký thao tác...</p>
                ) : !selectedOrder.histories || selectedOrder.histories.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-500 text-center">
                    Chưa có nhật ký ghi nhận trước đó cho đơn hàng này.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E7E0D5]">
                    {selectedOrder.histories.map((h) => (
                      <div key={h.id} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#8C5D3B] border-2 border-white ring-2 ring-stone-200" />
                        <div className="bg-[#FAFAF8] p-3 rounded-xl border border-[#E7E0D5] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                              {h.action}
                              {h.fromStatus && h.toStatus && h.fromStatus !== h.toStatus && (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-stone-500">
                                  ({h.fromStatus} <ArrowRight className="w-2.5 h-2.5" /> {h.toStatus})
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(h.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Người thực hiện: <strong className="text-stone-700">{h.changedBy}</strong>
                          </p>
                          {h.note && (
                            <p className="text-[11px] text-stone-600 bg-white p-2 rounded border border-stone-200">
                              {h.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#F0EBE3]">
                <Button variant="secondary" size="md" onClick={() => setSelectedOrder(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xác Nhận Cập Nhật Trạng Thái Đơn Hàng (State Transition) */}
        {updateModalOpen && updatingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setUpdateModalOpen(false)} />
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-[#E7E0D5] z-10 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <div>
                  <h3 className="font-bold text-base text-[#1C1917] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#8C5D3B]" />
                    Xác Nhận Chuyển Trạng Thái
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Đơn hàng: <strong className="font-mono text-[#8C5D3B]">{updatingOrder.orderNumber}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {updateError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{updateError}</span>
                </div>
              )}

              {/* Cảnh báo đặc biệt khi hủy đơn */}
              {targetStatus === 'CANCELLED' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <strong className="block font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Chú ý quan trọng:
                  </strong>
                  <p>
                    Thao tác này sẽ chuyển đơn sang <strong>ĐÃ HỦY</strong>. Hệ thống sẽ <strong>tự động hoàn lại số lượng tồn kho</strong> cho toàn bộ sách trong đơn và mở lại mã giảm giá (nếu có).
                  </p>
                </div>
              )}

              {targetStatus === 'DELIVERED' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <p>
                    Xác nhận đơn hàng đã được giao tận tay khách. Nếu là đơn COD, hệ thống sẽ tự động cập nhật thanh toán thành <strong>ĐÃ THANH TOÁN (PAID)</strong>.
                  </p>
                </div>
              )}

              <form onSubmit={handleConfirmStatusUpdate} className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-stone-700">Trạng thái mới chuyển sang:</label>
                  <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#D5CDC0] font-bold text-[#8C5D3B]">
                    {targetStatus}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-stone-700">
                    {targetStatus === 'CANCELLED' ? 'Lý do hủy đơn (bắt buộc):' : 'Ghi chú quản trị (tùy chọn):'}
                  </label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={
                      targetStatus === 'CANCELLED'
                        ? 'Ví dụ: Khách gọi yêu cầu hủy do đặt nhầm, không thể giao hàng...'
                        : 'Nhập ghi chú hoặc mã vận đơn gửi hàng...'
                    }
                    className="w-full rounded-xl border border-[#D5CDC0] p-3 text-xs focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                    required={targetStatus === 'CANCELLED'}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    disabled={isSubmitting}
                    onClick={() => setUpdateModalOpen(false)}
                  >
                    Hủy Bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className={targetStatus === 'CANCELLED' ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600' : undefined}
                    size="md"
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Thay Đổi'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cập Nhật Trạng Thái Thanh Toán Riêng Biệt */}
        {paymentModalOpen && payingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setPaymentModalOpen(false)} />
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-[#E7E0D5] z-10 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <div>
                  <h3 className="font-bold text-base text-[#1C1917] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#B88E52]" />
                    Cập Nhật Thanh Toán
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Đơn hàng: <strong className="font-mono text-[#8C5D3B]">{payingOrder.orderNumber}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <p>
                  <strong>Nguyên tắc:</strong> Không tự đánh dấu thanh toán thành công nếu chưa có sao kê ngân hàng hoặc đối soát xác nhận phù hợp.
                </p>
              </div>

              <form onSubmit={handleConfirmPaymentUpdate} className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-stone-700">Tình trạng thanh toán mới:</label>
                  <select
                    value={targetPaymentStatus}
                    onChange={(e) => setTargetPaymentStatus(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#8C5D3B]"
                  >
                    <option value="PAID">Đã thanh toán (PAID)</option>
                    <option value="UNPAID">Chưa thanh toán (UNPAID)</option>
                    <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
                    <option value="FAILED">Thanh toán thất bại (FAILED)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-stone-700">Mã giao dịch ngân hàng / VNPAY:</label>
                  <input
                    type="text"
                    value={paymentTxCode}
                    onChange={(e) => setPaymentTxCode(e.target.value)}
                    placeholder="Ví dụ: VNP12345678, FT26019283..."
                    className="w-full text-xs rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#8C5D3B]"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-stone-700">Ghi chú xác nhận đối soát:</label>
                  <textarea
                    rows={2}
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Ghi chú xác nhận từ sao kê kế toán..."
                    className="w-full rounded-xl border border-[#D5CDC0] p-2.5 text-xs focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    disabled={isSubmittingPayment}
                    onClick={() => setPaymentModalOpen(false)}
                  >
                    Hủy Bỏ
                  </Button>
                  <Button type="submit" variant="primary" size="md" isLoading={isSubmittingPayment}>
                    {isSubmittingPayment ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal Cập Nhật Trạng Thái Vận Chuyển GHN - Phase 9 */}
        {updateShipmentModalOpen && currentShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setUpdateShipmentModalOpen(false)} />
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-[#E7E0D5] z-10 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <div>
                  <h3 className="font-bold text-base text-[#1C1917] flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#B88E52]" />
                    Cập Nhật Trạng Thái Vận Đơn GHN
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Mã vận đơn: <strong className="font-mono text-[#8C5D3B]">{currentShipment.trackingNumber || 'Chưa cấp mã'}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUpdateShipmentModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {shipmentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{shipmentError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#FAF0E6] border border-[#D5E4D8] text-xs text-[#8C5D3B]">
                <p>
                  <strong>Đồng bộ tự động:</strong> Khi trạng thái chuyển sang <strong>DELIVERED</strong>, đơn hàng sẽ được tự động đồng bộ sang trạng thái <strong>ĐÃ GIAO THÀNH CÔNG</strong>.
                </p>
              </div>

              <form onSubmit={handleConfirmShipmentUpdate} className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-stone-700">Trạng thái vận chuyển mới:</label>
                  <select
                    value={targetShipmentStatus}
                    onChange={(e) => setTargetShipmentStatus(e.target.value as ShippingStatus)}
                    className="w-full text-xs rounded-xl border border-[#D5CDC0] p-2.5 bg-[#FAFAF8] focus:outline-none focus:border-[#8C5D3B]"
                  >
                    <option value="PENDING">PENDING - Chờ bưu cục lấy hàng</option>
                    <option value="PICKED_UP">PICKED_UP - Bưu tá đã nhận sách</option>
                    <option value="IN_TRANSIT">IN_TRANSIT - Đang luân chuyển / Giao hàng</option>
                    <option value="DELIVERED">DELIVERED - Đã phát hàng thành công</option>
                    <option value="FAILED_ATTEMPT">FAILED_ATTEMPT - Giao thất bại / Hẹn lại</option>
                    <option value="RETURNED">RETURNED - Bưu phẩm chuyển hoàn về kho</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-stone-700">Ghi chú bưu tá / lý do điều chỉnh:</label>
                  <textarea
                    rows={2}
                    value={shipmentNote}
                    onChange={(e) => setShipmentNote(e.target.value)}
                    placeholder="Ví dụ: Đã giao khách ký nhận, hoặc khách hẹn giao lại chiều..."
                    className="w-full rounded-xl border border-[#D5CDC0] p-2.5 text-xs focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    disabled={isSubmittingShipment}
                    onClick={() => setUpdateShipmentModalOpen(false)}
                  >
                    Hủy Bỏ
                  </Button>
                  <Button type="submit" variant="primary" size="md" isLoading={isSubmittingShipment}>
                    {isSubmittingShipment ? 'Đang lưu...' : 'Lưu Trạng Thái'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
