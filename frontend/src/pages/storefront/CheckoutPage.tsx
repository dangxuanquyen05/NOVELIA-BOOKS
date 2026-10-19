import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  AlertCircle,
  CreditCard,
  Clock,
  Sparkles,
  Tag,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { couponService } from '../../services/couponService';
import { paymentService } from '../../services/paymentService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import type { CheckoutSummary, CreateOrderRequest } from '../../types/order';
import type { Coupon, CouponValidationResult } from '../../types/coupon';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { VietnamAddressSelector } from '../../components/common/VietnamAddressSelector';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCart } = useCart();

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address selection state
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // New address form state
  const [receiverName, setReceiverName] = useState(user?.fullName || '');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');

  // Payment Method: COD or VNPAY
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  // Order notes
  const [note, setNote] = useState('');

  // Fixed idempotency key per checkout session
  const [idempotencyKey] = useState(() => 'order-idem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9));

  // VNPay redirect modal/notice
  const [vnpayRedirectData, setVnpayRedirectData] = useState<{
    orderNumber: string;
    paymentUrl: string;
    amount: number;
    notice: string;
  } | null>(null);

  useEffect(() => {
    loadCheckoutSummary();
    loadAvailableCoupons();
  }, []);

  const loadCheckoutSummary = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await orderService.getCheckoutSummary();
      setSummary(data);

      if (!data.items || data.items.length === 0) {
        navigate('/cart');
        return;
      }

      if (data.savedAddresses && data.savedAddresses.length > 0) {
        const defaultAddr = data.savedAddresses.find((a) => a.isDefault) || data.savedAddresses[0];
        setSelectedAddressId(defaultAddr.id);
        setUseNewAddress(false);
      } else {
        setUseNewAddress(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tải thông tin tóm tắt đơn hàng.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableCoupons = async () => {
    try {
      const coupons = await couponService.getAvailableCoupons();
      setAvailableCoupons(coupons);
    } catch {
      // Non-critical, silent fail
    }
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponMsg({ type: 'error', text: 'Vui lòng nhập mã ưu đãi' });
      return;
    }
    if (!summary) return;

    setIsCheckingCoupon(true);
    setCouponMsg(null);

    try {
      const result = await couponService.validateCoupon(code, summary.subtotal);
      if (result.valid) {
        setAppliedCoupon(result);
        setCouponInput(result.code || code);
        setCouponMsg({ type: 'success', text: result.message || 'Áp dụng mã ưu đãi thành công!' });
      } else {
        setAppliedCoupon(null);
        setCouponMsg({ type: 'error', text: result.message || 'Mã ưu đãi không hợp lệ' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể kiểm tra mã ưu đãi lúc này';
      setAppliedCoupon(null);
      setCouponMsg({ type: 'error', text: msg });
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg(null);
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = summary ? Math.max(0, summary.subtotal + summary.shippingFee - discountAmount) : 0;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSubmitting) return;

    // Validation
    if (useNewAddress) {
      if (!receiverName.trim()) {
        setErrorMsg('Vui lòng nhập họ tên người nhận.');
        return;
      }
      if (!receiverPhone.trim() || !/^[0-9+ ]{9,15}$/.test(receiverPhone.trim())) {
        setErrorMsg('Vui lòng nhập số điện thoại người nhận hợp lệ (9 - 15 chữ số).');
        return;
      }
      if (!province.trim()) {
        setErrorMsg('Vui lòng nhập Tỉnh / Thành phố.');
        return;
      }
      if (!district.trim()) {
        setErrorMsg('Vui lòng nhập Quận / Huyện.');
        return;
      }
      if (!ward.trim()) {
        setErrorMsg('Vui lòng nhập Phường / Xã.');
        return;
      }
      if (!detailedAddress.trim()) {
        setErrorMsg('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).');
        return;
      }
    } else {
      if (!selectedAddressId) {
        setErrorMsg('Vui lòng chọn một địa chỉ nhận hàng.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: CreateOrderRequest = {
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        note: note.trim() || undefined,
        idempotencyKey,
      };

      if (useNewAddress) {
        payload.receiverName = receiverName.trim();
        payload.receiverPhone = receiverPhone.trim();
        payload.phone = receiverPhone.trim();
        payload.detailedAddress = detailedAddress.trim();
        payload.specificAddress = detailedAddress.trim();
        payload.province = province.trim();
        payload.provinceCity = province.trim();
        payload.district = district.trim();
        payload.ward = ward.trim();
      } else {
        payload.addressId = selectedAddressId!;
      }

      const order = await orderService.createOrder(payload);

      // Refresh cart context
      await refreshCart();

      if (paymentMethod === 'VNPAY') {
        // Initialize payment URL
        try {
          const paymentData = await paymentService.createPaymentUrl(order.orderNumber, 'VNPAY');
          setVnpayRedirectData({
            orderNumber: order.orderNumber,
            paymentUrl: paymentData.paymentUrl,
            amount: paymentData.amount,
            notice: paymentData.integrationNotice,
          });
        } catch {
          // If payment URL generation fails, still redirect to order success page
          navigate(`/order-success/${order.orderNumber}`);
        }
      } else {
        // COD order
        navigate(`/order-success/${order.orderNumber}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại tồn kho hoặc giỏ hàng.';
      setErrorMsg(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!vnpayRedirectData) return;
    try {
      await paymentService.simulateTestPaymentSuccess(vnpayRedirectData.orderNumber);
      navigate(`/order-success/${vnpayRedirectData.orderNumber}?paid=true`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi mô phỏng thanh toán');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#8C5D3B]/20 border-t-[#8C5D3B] rounded-full animate-spin" />
          <span className="font-serif-title text-sm text-[#8C5D3B] font-semibold">
            Đang xác nhận tồn kho và giá niêm yết...
          </span>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const threshold = summary.freeShippingThreshold || 500000;
  const freeShippingLeft = Math.max(0, threshold - summary.subtotal);

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-[#8C5D3B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Giỏ hàng</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Thanh Toán & Xác Nhận Đơn Hàng
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Vui lòng kiểm tra kỹ địa chỉ nhận sách và áp dụng mã ưu đãi trước khi đặt hàng.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Không thể hoàn tất đơn hàng</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* VNPay Redirect / Sandbox Test Modal */}
        {vnpayRedirectData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E7E0D5] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-emerald-800">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#8C5D3B]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif-title text-lg font-bold text-[#1C1917]">
                    Cổng Thanh Toán VNPay Sandbox
                  </h3>
                  <p className="text-xs text-stone-500">Đơn hàng #{vnpayRedirectData.orderNumber}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E7E0D5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tổng thanh toán:</span>
                  <span className="font-bold font-mono text-sm text-[#8C5D3B]">
                    {formatCurrencyVND(vnpayRedirectData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Chế độ:</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Thử nghiệm Sandbox
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed pt-2 border-t border-[#F0EBE3]">
                  {vnpayRedirectData.notice}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href={vnpayRedirectData.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8C5D3B] text-white text-xs font-bold hover:bg-[#754C2F] shadow-sm transition-all"
                >
                  <span>Chuyển Sang Cổng VNPay Sandbox</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <Button
                  variant="gold"
                  size="md"
                  className="w-full"
                  onClick={handleSimulatePaymentSuccess}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Mô phỏng Thanh toán Thành công Ngay (Test Mode)
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-stone-500"
                  onClick={() => navigate(`/order-success/${vnpayRedirectData.orderNumber}`)}
                >
                  Bỏ qua & Xem đơn hàng (Thanh toán sau)
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Delivery Address & Payment (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Shipping Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E0D5] shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#8C5D3B] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917]">
                    Địa Chỉ Giao Sách
                  </h2>
                </div>
              </div>

              {/* Saved Addresses Option */}
              {summary.savedAddresses && summary.savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-600">Sổ địa chỉ đã lưu</span>
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(!useNewAddress)}
                      className="text-xs font-bold text-[#8C5D3B] hover:underline cursor-pointer"
                    >
                      {useNewAddress ? 'Chọn từ sổ địa chỉ' : '+ Giao đến địa chỉ mới'}
                    </button>
                  </div>

                  {!useNewAddress && (
                    <div className="space-y-2">
                      {summary.savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                              isSelected
                                ? 'border-[#8C5D3B] bg-[#8C5D3B]/5 shadow-xs ring-1 ring-[#8C5D3B]'
                                : 'border-[#E7E0D5] hover:border-stone-400 bg-white'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                                  {addr.recipientName}
                                </span>
                                <span className="text-stone-400 text-xs">•</span>
                                <span className="font-mono text-xs text-stone-600">{addr.phone}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-[#C5A059]/20 text-[#8C6D23] font-semibold px-2 py-0.5 rounded-full">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                {addr.fullAddressText || `${addr.addressLine1}, ${addr.city}`}
                              </p>
                            </div>
                            <div className="mt-1">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-[#8C5D3B] bg-[#8C5D3B]' : 'border-stone-300'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Direct Address Input Form */}
              {useNewAddress && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Họ và tên người nhận *
                      </label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Số điện thoại người nhận *
                      </label>
                      <input
                        type="tel"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        placeholder="0912345678"
                        className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                        required
                      />
                    </div>
                  </div>

                  {/* Bộ chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã chuẩn Việt Nam */}
                  <VietnamAddressSelector
                    province={province}
                    district={district}
                    ward={ward}
                    onChange={({ province: p, district: d, ward: w }) => {
                      setProvince(p);
                      setDistrict(d);
                      setWard(w);
                    }}
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Địa chỉ cụ thể (Số nhà, ngõ, tên đường) *
                    </label>
                    <input
                      type="text"
                      value={detailedAddress}
                      onChange={(e) => setDetailedAddress(e.target.value)}
                      placeholder="Số 45 Tràng Tiền, Cửa hàng sách Novelia..."
                      className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Shipping Carrier Banner (Phase 9 - GHN Carrier Framework) */}
              <div className="pt-2">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8D7C5] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#8C5D3B] text-white flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-[#1C1917] block">Giao Hàng Nhanh (GHN) • Vận chuyển tiêu chuẩn</span>
                      <span className="text-[11px] text-stone-600">Đóng gói carton & màng co bảo vệ sách • Dự kiến 1 - 3 ngày làm việc</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-[#8C5D3B]">
                      {summary.shippingFee === 0 ? 'MIỄN PHÍ' : formatCurrencyVND(summary.shippingFee)}
                    </span>
                    {summary.subtotal >= 500000 && (
                      <span className="block text-[10px] text-emerald-700 font-semibold">Freeship ≥ 500k</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E0D5] shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#F0EBE3]">
                <span className="w-7 h-7 rounded-full bg-[#8C5D3B] text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917]">
                  Phương Thức Thanh Toán
                </h2>
              </div>

              <div className="space-y-3">
                {/* Method 1: COD */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                    paymentMethod === 'COD'
                      ? 'border-[#8C5D3B] bg-[#8C5D3B]/5 ring-1 ring-[#8C5D3B]'
                      : 'border-[#E7E0D5] hover:border-stone-400 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1 text-[#8C5D3B] focus:ring-[#8C5D3B]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                          Thanh toán khi nhận hàng (COD)
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Kiểm tra sách kỹ lưỡng và thanh toán tiền mặt trực tiếp cho nhân viên bưu tá khi nhận kiện hàng.
                      </p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-[#8C5D3B] shrink-0 mt-0.5" />
                </div>

                {/* Method 2: VNPay Sandbox */}
                <div
                  onClick={() => setPaymentMethod('VNPAY')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                    paymentMethod === 'VNPAY'
                      ? 'border-[#8C5D3B] bg-[#8C5D3B]/5 ring-1 ring-[#8C5D3B]'
                      : 'border-[#E7E0D5] hover:border-stone-400 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={() => setPaymentMethod('VNPAY')}
                      className="mt-1 text-[#8C5D3B] focus:ring-[#8C5D3B]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                          Cổng thanh toán điện tử VNPay (Sandbox Thử Nghiệm)
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                          Sandbox Mode
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Hỗ trợ quét mã VNPay-QR, thẻ ATM nội địa & Internet Banking. Tuyệt đối không lưu thông tin thẻ nhạy cảm (Chuẩn PCI-DSS).
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                </div>
              </div>
            </div>

            {/* Step 3: Order Notes */}
            <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs space-y-3">
              <label className="block text-xs font-semibold text-stone-700">
                Ghi chú cho đơn hàng (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao 15 phút..."
                className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3 focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                maxLength={500}
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E0D5] shadow-xs space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917]">
                  Tóm Tắt Đơn Hàng ({summary.items.length})
                </h2>
                <Link to="/cart" className="text-xs font-semibold text-[#8C5D3B] hover:underline">
                  Sửa giỏ hàng
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-[#F0EBE3]">
                {summary.items.map((item) => (
                  <div key={item.bookId} className="pt-3 first:pt-0 flex items-start gap-3">
                    <img
                      src={item.bookCover || item.coverImageUrl || FALLBACK_COVER}
                      alt={item.bookTitle}
                      className="w-12 h-16 object-cover rounded-md border border-[#E7E0D5] shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_COVER;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#1C1917] line-clamp-2 leading-snug">
                        {item.bookTitle}
                      </h4>
                      <div className="flex items-center justify-between mt-1 text-xs text-stone-500">
                        <span>SL: {item.quantity}</span>
                        <span className="font-mono font-semibold text-[#1C1917]">
                          {formatCurrencyVND(item.totalPrice ?? item.subtotal ?? (item.unitPrice * item.quantity))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="pt-3 border-t border-[#F0EBE3] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                  <Tag className="w-4 h-4 text-[#8C5D3B]" />
                  <span>Mã Giảm Giá / Phiếu Ưu Đãi</span>
                </div>

                {appliedCoupon ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold font-mono">{appliedCoupon.code}</span>
                        <span className="block text-[11px] text-emerald-700">
                          Tiết kiệm {formatCurrencyVND(appliedCoupon.discountAmount || 0)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                      title="Hủy mã ưu đãi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã (Vd: NOVELIA10)"
                        className="flex-1 text-xs uppercase font-mono rounded-xl border border-[#D5CDC0] px-3 py-2.5 focus:outline-none focus:border-[#8C5D3B] bg-[#FAFAF8]"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApplyCoupon()}
                        isLoading={isCheckingCoupon}
                      >
                        Áp Dụng
                      </Button>
                    </div>

                    {couponMsg && (
                      <p
                        className={`text-xs ${
                          couponMsg.type === 'success' ? 'text-emerald-700 font-semibold' : 'text-red-600'
                        }`}
                      >
                        {couponMsg.text}
                      </p>
                    )}

                    {/* Available coupons suggestion chips */}
                    {availableCoupons.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        <span className="text-[11px] text-stone-400 self-center">Gợi ý:</span>
                        {availableCoupons.slice(0, 3).map((cp) => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => handleApplyCoupon(cp.code)}
                            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#8C5D3B]/10 text-[#8C5D3B] hover:bg-[#8C5D3B]/20 border border-[#8C5D3B]/30 transition-all cursor-pointer"
                          >
                            {cp.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping Progress */}
              {freeShippingLeft > 0 ? (
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8D7C5] text-xs text-stone-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Truck className="w-4 h-4 text-[#8C5D3B]" />
                    <span>Mua thêm {formatCurrencyVND(freeShippingLeft)} để được Miễn Phí Vận Chuyển</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#8C5D3B] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (summary.subtotal / threshold) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Đơn hàng của bạn đủ điều kiện MIỄN PHÍ vận chuyển toàn quốc!</span>
                </div>
              )}

              {/* Financial Calculation */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tạm tính sách:</span>
                  <span className="font-mono font-semibold text-[#1C1917]">
                    {formatCurrencyVND(summary.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-mono font-semibold">
                    {summary.shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">Miễn Phí</span>
                    ) : (
                      formatCurrencyVND(summary.shippingFee)
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Giảm giá ({appliedCoupon?.code}):</span>
                    <span className="font-mono">-{formatCurrencyVND(discountAmount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-[#F0EBE3] flex items-baseline justify-between">
                  <span className="font-bold text-sm text-[#1C1917]">Tổng Thanh Toán:</span>
                  <div className="text-right">
                    <span className="font-serif-title text-2xl font-bold text-[#8C5D3B] font-mono block">
                      {formatCurrencyVND(finalTotal)}
                    </span>
                    <span className="text-[10px] text-stone-400">Đã bao gồm thuế & bọc lót sách</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-4 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang Xử Lý Đơn Hàng...
                  </span>
                ) : paymentMethod === 'VNPAY' ? (
                  'Thanh Toán Qua VNPay Sandbox'
                ) : (
                  'Xác Nhận Đặt Hàng (COD)'
                )}
              </Button>

              {/* Guarantee */}
              <div className="pt-3 border-t border-[#F0EBE3] space-y-2 text-[11px] text-stone-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8C5D3B]" />
                  <span>Cam kết giá niêm yết chính xác từ nhà xuất bản</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8C5D3B]" />
                  <span>Xử lý và bàn giao đơn vị vận chuyển trong 24 giờ</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
