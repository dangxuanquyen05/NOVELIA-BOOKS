import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  Mail,
  LogOut,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Calendar,
  X,
  Eye
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { addressService } from '../../services/addressService';
import type { Order } from '../../types/order';
import type { Address } from '../../types/order';
import { formatCurrencyVND } from '../../utils/format';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const ProfilePage: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Cancel order modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; isError?: boolean }>({
    show: false,
    message: '',
  });

  const showToast = (message: string, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadMyOrders();
    } else {
      loadAddresses();
    }
  }, [activeTab, selectedStatus]);

  const loadMyOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus;
      const res = await orderService.getMyOrders(0, 20, statusParam);
      setOrders(res.content || []);
      setTotalOrders(res.totalElements || 0);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách đơn hàng', true);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await addressService.getMyAddresses();
      setAddresses(res || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tải sổ địa chỉ', true);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleOpenCancelModal = (order: Order) => {
    setCancelingOrder(order);
    setCancelReason('');
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingOrder) return;

    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do bạn muốn hủy đơn hàng.');
      return;
    }

    setIsSubmittingCancel(true);
    setCancelError(null);

    try {
      await orderService.cancelOrder(cancelingOrder.orderNumber, cancelReason.trim());
      showToast(`Đã hủy đơn hàng ${cancelingOrder.orderNumber} thành công. Tồn kho sách đã được hoàn lại.`);
      setCancelModalOpen(false);
      setCancelingOrder(null);
      // Reload orders
      await loadMyOrders();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể hủy đơn hàng lúc này.';
      setCancelError(msg);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Chờ Xác Nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Đã Xác Nhận
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" /> Đang Vận Chuyển
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Giao Thành Công
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
            <XCircle className="w-3 h-3 text-stone-500" /> Đã Hủy
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <RotateCcw className="w-3 h-3 text-rose-600" /> Đã Hoàn Tiền
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 sm:py-14 space-y-8 px-4">
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

      {/* Top Profile Card */}
      <div className="p-7 sm:p-9 rounded-3xl bg-white border border-[#E7E0D5] shadow-xs flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-[#1B3B2B] text-white flex items-center justify-center text-3xl font-bold font-serif-title shadow-sm">
          {user.fullName.charAt(0).toUpperCase()}
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="font-serif-title text-2xl font-bold text-[#1C1917]">{user.fullName}</h1>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EDF3EF] text-[#1B3B2B] border border-[#D5E3DA]">
              Độc Giả NOVELIA
            </span>
          </div>

          <p className="text-xs text-[#78716C] flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#B88E52]" />
            <span>{user.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center">
          {isAdmin && (
            <Button variant="gold" size="sm" onClick={() => navigate('/admin/dashboard')}>
              Trang Quản Trị
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
            Đăng Xuất
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E7E0D5] gap-8">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'orders'
              ? 'text-[#1B3B2B]'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" /> Đơn Hàng Của Tôi ({totalOrders})
          </span>
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3B2B] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'addresses'
              ? 'text-[#1B3B2B]'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Sổ Địa Chỉ Nhận Hàng ({addresses.length})
          </span>
          {activeTab === 'addresses' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3B2B] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Status Filter Bar */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: 'Tất Cả', value: 'ALL' },
              { label: 'Chờ Xác Nhận', value: 'PENDING' },
              { label: 'Đã Xác Nhận', value: 'CONFIRMED' },
              { label: 'Đang Vận Chuyển', value: 'SHIPPING' },
              { label: 'Đã Giao', value: 'DELIVERED' },
              { label: 'Đã Hủy', value: 'CANCELLED' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedStatus === tab.value
                    ? 'bg-[#1B3B2B] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-[#E7E0D5] hover:border-stone-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {isLoadingOrders ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-white rounded-3xl border border-stone-200/60 p-6 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-[#E7E0D5] text-center space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif-title text-base font-bold text-stone-700">Chưa có đơn hàng nào</h3>
              <p className="text-xs text-stone-500">
                {selectedStatus === 'ALL'
                  ? 'Bạn chưa đặt mua cuốn sách nào tại NOVELIA BOOKS.'
                  : `Không có đơn hàng nào ở trạng thái này.`}
              </p>
              <Link to="/books" className="inline-block pt-2">
                <Button variant="primary" size="sm">Khám Phá Sách Ngay</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => {
                const canCancel = order.status === 'PENDING';
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E0D5] shadow-xs space-y-4 hover:border-stone-300 transition-all"
                  >
                    {/* Header: Order Number, Date, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0EBE3]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-400">Mã đơn:</span>
                          <span className="font-mono font-bold text-sm text-[#1B3B2B]">{order.orderNumber}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {renderStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Books in this order */}
                    <div className="divide-y divide-[#F0EBE3]">
                      {order.items?.map((item) => (
                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                          <img
                            src={item.coverImageUrl || (item as any).bookCover || FALLBACK_COVER}
                            alt={item.bookTitle}
                            className="w-12 h-16 object-cover rounded-md border border-[#E7E0D5] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_COVER;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#1C1917] line-clamp-1">{item.bookTitle}</h4>
                            <div className="text-xs text-stone-500 mt-1 flex items-center gap-3">
                              <span>Số lượng: <strong className="font-mono">{item.quantity}</strong></span>
                              <span>•</span>
                              <span>Đơn giá: <strong className="font-mono">{formatCurrencyVND(item.unitPrice || (item as any).price)}</strong></span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-semibold text-xs sm:text-sm text-[#1B3B2B]">
                              {formatCurrencyVND(item.totalPrice)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Note if cancelled */}
                    {order.note && (
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 italic">
                        {order.note}
                      </div>
                    )}

                    {/* Bottom: Total & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#F0EBE3]">
                      <div>
                        <span className="text-xs text-stone-400 block">Tổng thanh toán ({order.paymentMethod}):</span>
                        <span className="font-serif-title text-base sm:text-lg font-bold text-[#1B3B2B] font-mono">
                          {formatCurrencyVND(order.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Link to={`/order-success/${order.orderNumber}`}>
                          <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                            Chi Tiết
                          </Button>
                        </Link>

                        {/* Customer Cancel Button (Only enabled when PENDING) */}
                        {canCancel && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenCancelModal(order)}
                          >
                            Hủy Đơn Hàng
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          {isLoadingAddresses ? (
            <div className="h-36 bg-white rounded-3xl border border-stone-200/60 p-6 animate-pulse" />
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#E7E0D5] text-center space-y-2">
              <MapPin className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500">Bạn chưa có địa chỉ nhận hàng nào được lưu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1C1917]">{addr.recipientName}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-[#EDF3EF] text-[#1B3B2B] font-semibold px-2 py-0.5 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-stone-600">{addr.phone}</p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {addr.fullAddressText || `${addr.addressLine1}, ${addr.ward || ''}, ${addr.district || ''}, ${addr.city}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && cancelingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => !isSubmittingCancel && setCancelModalOpen(false)} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-[#E7E0D5] z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE3]">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Xác Nhận Hủy Đơn Hàng</span>
              </div>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={() => setCancelModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Bạn đang yêu cầu hủy đơn hàng <strong className="text-[#1B3B2B] font-mono">{cancelingOrder.orderNumber}</strong>. Sau khi hủy, đơn hàng sẽ không thể khôi phục và số lượng sách sẽ được hoàn trả lại kho.
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Lý do hủy đơn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Thay đổi địa chỉ nhận sách, muốn đặt cuốn khác..."
                  className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#1B3B2B] bg-[#FAFAF8]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingCancel}
                  onClick={() => setCancelModalOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingCancel}
                  className="bg-rose-700 hover:bg-rose-800 text-white border-transparent"
                >
                  {isSubmittingCancel ? 'Đang Xử Lý Hủy...' : 'Xác Nhận Hủy Đơn'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
