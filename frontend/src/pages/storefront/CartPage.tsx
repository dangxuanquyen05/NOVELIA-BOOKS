import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, AlertCircle, ShoppingBag, Truck, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';
const FREESHIP_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, isLoading, updateQuantity, removeItem, clearCart } = useCart();

  const [toast, setToast] = useState<{ show: boolean; message: string; isError?: boolean }>({
    show: false,
    message: '',
  });

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const showToast = (message: string, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const handleUpdateQty = async (itemId: number, currentQty: number, delta: number, maxStock: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    if (newQty > maxStock) {
      showToast(`Tồn kho khả dụng chỉ còn ${maxStock} cuốn`, true);
      return;
    }

    const res = await updateQuantity(itemId, newQty);
    if (!res.success) {
      showToast(res.message || 'Không thể cập nhật số lượng', true);
    }
  };

  const handleRemoveItem = async (itemId: number, bookTitle: string) => {
    const res = await removeItem(itemId);
    if (res.success) {
      showToast(`Đã xóa "${bookTitle}" khỏi giỏ hàng`);
    } else {
      showToast(res.message || 'Không thể xóa tác phẩm', true);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng?')) return;
    const res = await clearCart();
    if (res.success) {
      showToast('Đã làm trống giỏ hàng');
    } else {
      showToast(res.message || 'Không thể làm trống giỏ hàng', true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center space-y-6 max-w-lg mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-[#FAF0E6] text-[#8C5D3B] mx-auto flex items-center justify-center border border-[#E8D7C5]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif-title text-2xl font-bold text-stone-900">
          Đăng nhập để xem giỏ hàng
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Giỏ hàng của bạn được lưu trữ an toàn theo tài khoản. Hãy đăng nhập để tiếp tục hoàn thiện hành trình đọc sách của bạn.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="secondary" size="md" onClick={() => navigate('/books')}>
            Khám phá tủ sách
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/login')}>
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const isFreeShip = subtotal >= FREESHIP_THRESHOLD;
  const shipping = items.length > 0 ? (isFreeShip ? 0 : SHIPPING_FEE) : 0;
  const grandTotal = subtotal + shipping;
  const remainingForFreeShip = Math.max(0, FREESHIP_THRESHOLD - subtotal);
  const freeShipPercent = Math.min(100, Math.round((subtotal / FREESHIP_THRESHOLD) * 100));

  return (
    <div className="py-8 sm:py-12 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl shadow-2xl border animate-fade-in max-w-sm ${
            toast.isError
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-[#1C1917] text-white border-white/10'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              toast.isError ? 'bg-rose-600' : 'bg-[#8C5D3B]'
            }`}
          >
            {toast.isError ? <AlertCircle className="w-4 h-4 text-white" /> : <Check className="w-4 h-4 text-white" />}
          </div>
          <p className="text-xs font-semibold">{toast.message}</p>
        </div>
      )}

      {/* 3-Step Checkout Stepper from screenshot */}
      <div className="flex items-center justify-center max-w-xl mx-auto py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#8C5D3B] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span className="text-xs font-bold text-[#1C1917]">Giỏ hàng</span>
          </div>
          <div className="w-12 sm:w-16 h-0.5 bg-stone-300" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-semibold">
              2
            </span>
            <span className="text-xs text-stone-500">Thanh toán</span>
          </div>
          <div className="w-12 sm:w-16 h-0.5 bg-stone-300" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-semibold">
              3
            </span>
            <span className="text-xs text-stone-500">Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* Header & Breadcrumb */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EAE4DC] pb-4">
          <div>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
              Giỏ hàng của bạn
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
              Bạn đang có <strong className="text-[#8C5D3B] font-bold">{cart?.totalItems || 0} sản phẩm</strong> trong giỏ hàng.
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Làm trống giỏ hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart Content: Empty State vs Cart List */}
      {isLoading && !cart ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12 text-stone-400" />}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy dành chút thời gian dạo quanh các chuyên mục để khám phá những tác phẩm văn học và tri thức kinh điển."
          actionText="Khám Phá Tủ Sách Ngay"
          onAction={() => navigate('/books')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Items List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Progress Indicator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#EBE3D7] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#8C5D3B]" />
                  {isFreeShip ? (
                    <span className="text-emerald-800 font-bold">
                      Đơn hàng đã đạt chuẩn Miễn Phí Vận Chuyển toàn quốc!
                    </span>
                  ) : (
                    <span>
                      Mua thêm <strong className="text-[#8C5D3B]">{formatCurrencyVND(remainingForFreeShip)}</strong> để được Miễn Phí Vận Chuyển
                    </span>
                  )}
                </span>
                <span className="font-bold text-[#8C5D3B] font-mono">{freeShipPercent}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8C5D3B] transition-all duration-500 rounded-full"
                  style={{ width: `${freeShipPercent}%` }}
                />
              </div>
            </div>

            {/* Cart Items Cards */}
            <div className="space-y-3">
              {items.map((item) => {
                const isItemOutOfStock = item.stockQuantity <= 0;
                const isOverStock = item.quantity > item.stockQuantity;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EBE5DC] shadow-xs hover:border-[#8C5D3B]/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Book Thumbnail & Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Link
                        to={`/books/${item.bookSlug}`}
                        className="w-16 sm:w-20 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-[#F4EFEB] border border-stone-200"
                      >
                        <img
                          src={item.bookCover || FALLBACK_COVER}
                          alt={item.bookTitle}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_COVER;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="space-y-1 min-w-0 flex-1">
                        <Link
                          to={`/books/${item.bookSlug}`}
                          className="font-serif-title text-sm sm:text-base font-bold text-[#1C1917] hover:text-[#8C5D3B] transition-colors line-clamp-2"
                        >
                          {item.bookTitle}
                        </Link>

                        <div className="flex items-baseline gap-2">
                          <span className="text-xs sm:text-sm font-bold text-[#1C1917] font-mono">
                            {formatCurrencyVND(item.unitPrice)}
                          </span>
                          {item.originalPrice && item.originalPrice > item.unitPrice && (
                            <span className="text-[11px] text-stone-400 line-through font-mono">
                              {formatCurrencyVND(item.originalPrice)}
                            </span>
                          )}
                        </div>

                        {/* Stock warning if applicable */}
                        {isItemOutOfStock ? (
                          <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Tác phẩm tạm hết hàng trong kho
                          </p>
                        ) : isOverStock ? (
                          <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Tồn kho chỉ còn {item.stockQuantity} bản
                          </p>
                        ) : (
                          <p className="text-[10px] text-stone-400">
                            Kho còn {item.stockQuantity} bản
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-stone-300 rounded-xl bg-[#FAF7F2] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity, -1, item.stockQuantity)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 text-xs font-bold text-stone-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity, 1, item.stockQuantity)}
                          disabled={item.quantity >= item.stockQuantity}
                          className="px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="text-right min-w-[100px]">
                        <span className="text-sm sm:text-base font-bold text-[#1C1917] font-mono block">
                          {formatCurrencyVND(item.totalPrice)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id, item.bookTitle)}
                        aria-label="Xóa sản phẩm"
                        className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back to catalog button */}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate('/books')}
              >
                Tiếp Tục Chọn Sách
              </Button>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <div className="p-6 rounded-3xl bg-white border border-[#EBE5DC] shadow-md space-y-6">
              <h3 className="font-serif-title text-lg font-bold text-[#1C1917] pb-3 border-b border-[#F0EBE3]">
                Tóm Tắt Đơn Hàng
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Tạm tính ({cart?.totalItems || 0} sản phẩm)</span>
                  <span className="font-semibold text-stone-900 font-mono">
                    {formatCurrencyVND(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-stone-900 font-mono">
                    {isFreeShip ? (
                      <span className="text-emerald-700 font-bold">Miễn phí</span>
                    ) : (
                      formatCurrencyVND(SHIPPING_FEE)
                    )}
                  </span>
                </div>

                {/* Free shipping pill */}
                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Bạn được miễn phí vận chuyển!</span>
                </div>

                <div className="pt-4 border-t border-[#F0EBE3] flex items-baseline justify-between">
                  <span className="font-bold text-sm text-[#1C1917]">
                    Tổng tiền ({cart?.totalItems || 0} sản phẩm):
                  </span>
                  <div className="text-right">
                    <span className="font-serif-title text-xl sm:text-2xl font-bold text-[#8C5D3B] font-mono block">
                      {formatCurrencyVND(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Trigger Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3.5 px-6 rounded-full bg-[#8C5D3B] hover:bg-[#72482B] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <Link
                    to="/books"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#8C5D3B] transition"
                  >
                    <span>← Tiếp tục mua sắm</span>
                  </Link>
                </div>
              </div>

              {/* Commitments */}
              <div className="pt-4 border-t border-[#F0EBE3] space-y-2.5 text-[11px] text-stone-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8C5D3B]" />
                  <span>Sách chính ngạch có bản quyền 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8C5D3B]" />
                  <span>Đóng gói màng co chống gập mép tuyệt đối</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Preview Modal (as requested: not building checkout yet, but providing feedback) */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setIsCheckoutModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-[#E7E0D5] z-10 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#FAF0E6] text-[#8C5D3B] mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#B88E52]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-title text-xl font-bold text-[#1C1917]">
                Sẵn Sàng Cho Đơn Hàng
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Giỏ hàng của bạn gồm <strong>{cart?.totalItems} cuốn sách</strong> với tổng trị giá{' '}
                <strong className="text-[#8C5D3B]">{formatCurrencyVND(grandTotal)}</strong> đã được lưu trữ an toàn trong cơ sở dữ liệu.
              </p>
              <p className="text-xs text-stone-500 italic pt-1">
                (Phân hệ Đặt hàng & Thanh toán tự động sẽ được xây dựng ở giai đoạn tiếp theo theo đúng yêu cầu dự án).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCheckoutModalOpen(false)}
              >
                Tiếp Tục Quản Lý Giỏ Hàng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
