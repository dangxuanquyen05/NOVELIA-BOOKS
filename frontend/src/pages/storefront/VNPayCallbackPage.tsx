import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import type { PaymentCallbackResult } from '../../types/payment';
import { formatCurrencyVND } from '../../utils/format';

export const VNPayCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<PaymentCallbackResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    verifyCallback();
  }, []);

  const verifyCallback = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    try {
      const data = await paymentService.processVNPayCallback(params);
      setResult(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xác thực giao dịch thanh toán từ cổng VNPay';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-3 border-[#8C5D3B]/20 border-t-[#8C5D3B] rounded-full animate-spin" />
          <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#1C1917]">
            Đang Xác Thực Chữ Ký Số Giao Dịch VNPay...
          </h2>
          <p className="text-xs text-stone-500 max-w-sm">
            Hệ thống đang đối soát dữ liệu và mã checksum bảo mật HMAC-SHA512.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 sm:py-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E0D5] shadow-sm text-center space-y-6">
          {result?.success ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                  {result.isDuplicateRetry ? 'Giao Dịch Đã Xác Nhận' : 'Thanh Toán Thành Công'}
                </span>
                <h1 className="font-serif-title text-2xl font-bold text-[#1C1917] mt-3">
                  Xác Nhận Thanh Toán Hoàn Tất
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  Đơn hàng của quý khách đã được chuyển sang trạng thái <strong>Đã Xác Nhận</strong> và đang được chuẩn bị đóng gói.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E7E0D5] text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-stone-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-[#1C1917]">{result.orderNumber}</span>
                </div>
                {result.transactionCode && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Mã giao dịch VNPay:</span>
                    <span className="font-mono text-stone-700">{result.transactionCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Số tiền:</span>
                  <span className="font-mono font-bold text-[#8C5D3B]">{formatCurrencyVND(result.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Phương thức:</span>
                  <span className="font-semibold text-stone-700">VNPay Sandbox</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to={`/account/orders`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8C5D3B] text-white text-xs font-bold hover:bg-[#754C2F] transition-all shadow-sm"
                >
                  <span>Xem Chi Tiết Đơn Hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl border border-[#D5CDC0] text-stone-700 text-xs font-bold hover:bg-stone-50 transition-all"
                >
                  Về Trang Chủ
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-full uppercase">
                  Thanh Toán Thất Bại
                </span>
                <h1 className="font-serif-title text-2xl font-bold text-[#1C1917] mt-3">
                  Giao Dịch Không Thành Công
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  {errorMsg || result?.message || 'Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/account/orders"
                  className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl bg-[#8C5D3B] text-white text-xs font-bold hover:bg-[#754C2F] transition-all"
                >
                  Quản Lý Đơn Hàng
                </Link>
                <Link
                  to="/cart"
                  className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl border border-[#D5CDC0] text-stone-700 text-xs font-bold hover:bg-stone-50 transition-all"
                >
                  Quay Lại Giỏ Hàng
                </Link>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#F0EBE3] flex items-center justify-center gap-2 text-[11px] text-stone-400">
            <ShieldCheck className="w-4 h-4 text-[#8C5D3B]" />
            <span>Thanh toán an toàn qua cổng VNPay Sandbox • Chuẩn PCI-DSS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
