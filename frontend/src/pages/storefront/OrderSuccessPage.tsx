import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types/order';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      loadOrderDetails(orderNumber);
    }
  }, [orderNumber]);

  const loadOrderDetails = async (code: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await orderService.getOrderByOrderNumber(code);
      setOrder(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không tìm thấy thông tin đơn hàng.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] py-16 px-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-[#1B3B2B]/20 border-t-[#1B3B2B] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-600 font-medium font-serif-title tracking-wide">
            Đang tải thông tin đơn hàng NOVELIA...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-[70vh] bg-[#FBF9F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-[#E7E0D5] shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="font-serif-title text-xl font-bold text-[#1C1917]">Không Tìm Thấy Đơn Hàng</h2>
          <p className="text-xs text-stone-600">{errorMsg || 'Mã đơn hàng không hợp lệ hoặc bạn không có quyền truy cập.'}</p>
          <Link to="/books" className="inline-block pt-2">
            <Button variant="primary" size="md">Về Trang Chủ Sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Success Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E7E0D5] shadow-xs text-center space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#EDF3EF]/60 rounded-full blur-2xl -z-0" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FAF6EE] rounded-full blur-2xl -z-0" />

          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#EDF3EF] text-[#1B3B2B] mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9 text-[#1B3B2B]" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B88E52]">
                Đặt Hàng Thành Công
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
                Cảm ơn bạn đã lựa chọn NOVELIA BOOKS
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto pt-1 leading-relaxed">
                Đơn hàng của bạn đã được ghi nhận vào hệ thống và đang được chuẩn bị đóng gói màng co cẩn thận để gửi tới bạn sớm nhất.
              </p>
            </div>

            {/* Order Code Box */}
            <div className="inline-flex items-center gap-3 bg-[#F7FAF8] border border-[#D5E4D8] px-5 py-3 rounded-2xl shadow-2xs">
              <span className="text-xs text-stone-500">Mã đơn hàng:</span>
              <span className="font-mono text-sm sm:text-base font-bold text-[#1B3B2B] tracking-wider">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="p-1.5 hover:bg-white rounded-lg text-stone-600 hover:text-[#1B3B2B] transition-colors"
                title="Sao chép mã đơn"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Info Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E0D5] shadow-xs space-y-4">
            <h3 className="font-serif-title text-base font-bold text-[#1C1917] flex items-center gap-2 pb-3 border-b border-[#F0EBE3]">
              <MapPin className="w-4 h-4 text-[#B88E52]" /> Thông Tin Nhận Hàng
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Người nhận:</span>
                <span className="font-bold text-[#1C1917] text-sm">{order.recipientName}</span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Số điện thoại:</span>
                <span className="font-mono font-medium text-stone-700">{order.recipientPhone}</span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">Địa chỉ giao hàng:</span>
                <span className="text-stone-700 leading-relaxed block">{order.shippingAddress}</span>
              </div>

              <div className="pt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Đơn vị vận chuyển liên kết:</span>
                <span className="font-semibold text-[#1B3B2B]">Giao Hàng Nhanh (GHN)</span>
              </div>

              {order.note && (
                <div className="pt-2 border-t border-[#F0EBE3]">
                  <span className="text-stone-400 block text-[11px]">Ghi chú:</span>
                  <span className="text-stone-600 italic">"{order.note}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E0D5] shadow-xs space-y-4">
            <h3 className="font-serif-title text-base font-bold text-[#1C1917] flex items-center gap-2 pb-3 border-b border-[#F0EBE3]">
              <ShieldCheck className="w-4 h-4 text-[#B88E52]" /> Thanh Toán & Trạng Thái
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Trạng thái đơn hàng:</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {order.status === 'PENDING' ? 'Chờ xác nhận & chuẩn bị sách' : order.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Phương thức thanh toán:</span>
                <span className="font-semibold text-[#1C1917]">
                  {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Tình trạng thanh toán:</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                  {order.paymentStatus === 'UNPAID' ? 'Chưa thanh toán (Trả khi nhận hàng)' : order.paymentStatus}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Thời gian đặt:</span>
                <span className="font-mono text-stone-600">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Books Snapshot */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E0D5] shadow-xs space-y-5">
          <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917] pb-3 border-b border-[#F0EBE3] flex items-center justify-between">
            <span>Danh Sách Tác Phẩm Đã Mua ({order.items?.length || 0})</span>
            <span className="text-xs font-normal text-stone-500 italic">
              (Giá & tên tác phẩm đã lưu snapshot tại thời điểm đặt hàng)
            </span>
          </h3>

          <div className="divide-y divide-[#F0EBE3]">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4">
                <img
                  src={item.coverImageUrl || FALLBACK_COVER}
                  alt={item.bookTitle}
                  className="w-14 h-20 object-cover rounded-lg border border-[#E7E0D5] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_COVER;
                  }}
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-[#1C1917] line-clamp-2 leading-snug">
                    {item.bookTitle}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-stone-500">
                    <span>Đơn giá: <strong className="text-stone-700 font-mono">{formatCurrencyVND(item.unitPrice || (item as any).price)}</strong></span>
                    <span>•</span>
                    <span>Số lượng: <strong className="text-stone-700 font-mono">{item.quantity}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-serif-title text-sm sm:text-base font-bold text-[#1B3B2B] font-mono">
                    {formatCurrencyVND(item.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculation Breakdown */}
          <div className="pt-4 border-t border-[#F0EBE3] space-y-2 text-xs max-w-sm ml-auto">
            <div className="flex justify-between text-stone-600">
              <span>Tạm tính sách:</span>
              <span className="font-mono font-semibold text-[#1C1917]">
                {formatCurrencyVND(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Phí vận chuyển:</span>
              <span className="font-mono font-semibold">
                {order.shippingFee === 0 ? (
                  <span className="text-emerald-700 font-bold">Miễn Phí</span>
                ) : (
                  formatCurrencyVND(order.shippingFee)
                )}
              </span>
            </div>
            <div className="pt-3 border-t border-[#F0EBE3] flex items-baseline justify-between">
              <span className="font-bold text-sm text-[#1C1917]">Tổng Thanh Toán (COD):</span>
              <span className="font-serif-title text-xl sm:text-2xl font-bold text-[#1B3B2B] font-mono">
                {formatCurrencyVND(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/books" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Tiếp Tục Khám Phá Sách
            </Button>
          </Link>
          <Link to="/profile" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              Xem Lịch Sử Đơn Hàng
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
