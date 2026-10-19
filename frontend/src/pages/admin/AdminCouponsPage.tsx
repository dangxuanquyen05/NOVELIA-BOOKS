import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Percent,
  DollarSign,
  Tag,
  Clock,
  UserCheck,
  Ban,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { adminCouponService } from '../../services/adminCouponService';
import type { Coupon, CreateCouponInput, DiscountType, UpdateCouponInput } from '../../types/coupon';
import { formatCurrencyVND } from '../../utils/format';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal Create/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Confirm Terminate / Delete Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'TERMINATE' | 'DELETE';
    coupon: Coupon | null;
  }>({ isOpen: false, type: 'TERMINATE', coupon: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminCouponService.getAllCoupons(searchKeyword, page, 10);
      setCoupons(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Lỗi khi tải danh sách mã giảm giá:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCoupons();
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue(10);
    setMinOrderValue(0);
    setMaxDiscountAmount(undefined);
    setUsageLimit(undefined);
    setUsageLimitPerUser(1);
    const now = new Date();
    setStartDate(now.toISOString().slice(0, 16));
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setEndDate(nextMonth.toISOString().slice(0, 16));
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderValue(coupon.minOrderValue || 0);
    setMaxDiscountAmount(coupon.maxDiscountAmount);
    setUsageLimit(coupon.usageLimit);
    setUsageLimitPerUser(coupon.usageLimitPerUser || 1);
    setStartDate(coupon.startDate ? coupon.startDate.slice(0, 16) : '');
    setEndDate(coupon.endDate ? coupon.endDate.slice(0, 16) : '');
    setIsActive(coupon.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggle = async (id: number) => {
    try {
      await adminCouponService.toggleCouponStatus(id);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể đổi trạng thái mã');
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.coupon) return;
    setActionLoading(true);
    try {
      if (confirmModal.type === 'TERMINATE') {
        await adminCouponService.terminateCoupon(confirmModal.coupon.id);
      } else {
        await adminCouponService.deleteCoupon(confirmModal.coupon.id);
      }
      setConfirmModal({ isOpen: false, type: 'TERMINATE', coupon: null });
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Thao tác không thành công');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      if (editingCoupon) {
        const updatePayload: UpdateCouponInput = {
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          usageLimitPerUser: Number(usageLimitPerUser) || 1,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          isActive,
        };
        await adminCouponService.updateCoupon(editingCoupon.id, updatePayload);
      } else {
        const createPayload: CreateCouponInput = {
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          usageLimitPerUser: Number(usageLimitPerUser) || 1,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          isActive,
        };
        await adminCouponService.createCoupon(createPayload);
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu mã ưu đãi.');
    } finally {
      setModalLoading(false);
    }
  };

  // Stats calculation
  const totalActive = coupons.filter(c => c.isActive && new Date(c.endDate) >= new Date()).length;
  const totalUsed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <AdminLayout title="Quản Lý Khuyến Mãi & Mã Giảm Giá" subtitle="Thiết lập chính sách ưu đãi, hạn mức sử dụng và kiểm soát ngân sách chiết khấu">
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng số mã</span>
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-stone-900 mt-2">{totalElements}</p>
            <p className="text-[11px] text-stone-400 mt-1">Chương trình khuyến mãi</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Đang hiệu lực</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-emerald-800 mt-2">{totalActive}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Sẵn sàng áp dụng cho giỏ hàng</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng lượt dùng</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-blue-900 mt-2">{totalUsed.toLocaleString('vi-VN')}</p>
            <p className="text-[11px] text-stone-400 mt-1">Lượt đơn đã áp dụng thành công</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Hạn mức cá nhân</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-amber-900 mt-2">1 - 5 lượt</p>
            <p className="text-[11px] text-stone-400 mt-1">Kiểm soát lạm dụng mã ưu đãi</p>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm mã ưu đãi (VD: NOVELIA, TET2026)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#8C5D3B] bg-white shadow-2xs transition-colors"
            />
          </form>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCoupons}
              isLoading={loading}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Làm mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Tạo Mã Mới
            </Button>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-[#FAF7F2] text-stone-700 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Mã Ưu Đãi</th>
                  <th className="py-3.5 px-4">Hình Thức Giảm</th>
                  <th className="py-3.5 px-4">Đơn Tối Thiểu</th>
                  <th className="py-3.5 px-4">Lượt Dùng</th>
                  <th className="py-3.5 px-4">Thời Hạn Hiệu Lực</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <div className="w-6 h-6 border-2 border-[#8C5D3B]/20 border-t-[#8C5D3B] rounded-full animate-spin mx-auto mb-2" />
                      Đang tải danh sách mã giảm giá...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <Tag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      Không tìm thấy mã giảm giá nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => {
                    const isExpired = new Date(c.endDate) < new Date();
                    const isMaxUsed = c.usageLimit && c.usedCount >= c.usageLimit;
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#8C5D3B] bg-[#8C5D3B]/5 px-2.5 py-1 rounded-lg border border-[#8C5D3B]/10">
                              {c.code}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {c.discountType === 'PERCENTAGE' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              <Percent className="w-3 h-3" />
                              Giảm {c.discountValue}%
                              {c.maxDiscountAmount && ` (Tối đa ${formatCurrencyVND(c.maxDiscountAmount)})`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <DollarSign className="w-3 h-3" />
                              Giảm {formatCurrencyVND(c.discountValue)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium">
                          {c.minOrderValue ? formatCurrencyVND(c.minOrderValue) : '0đ'}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div>
                            <span className="font-bold text-stone-800">{c.usedCount}</span>
                            <span className="text-stone-400"> / {c.usageLimit ? c.usageLimit : '∞'} tổng</span>
                          </div>
                          <div className="text-[10px] text-stone-500 font-sans mt-0.5">
                            Tối đa: {c.usageLimitPerUser || 1} lần/KH
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] space-y-0.5">
                          <p className="text-stone-700">Đến: {new Date(c.endDate).toLocaleDateString('vi-VN')}</p>
                          {isExpired && (
                            <span className="text-[10px] text-stone-500 font-bold bg-stone-100 px-1.5 py-0.5 rounded inline-block">
                              Đã hết hạn
                            </span>
                          )}
                          {isMaxUsed && !isExpired && (
                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded inline-block">
                              Hết lượt dùng
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {c.isActive && !isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Đang áp dụng
                              </span>
                            ) : !c.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                                <XCircle className="w-3 h-3" />
                                Tạm dừng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                <Ban className="w-3 h-3" />
                                Hết hiệu lực
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          {/* Toggle Active / Pause */}
                          <button
                            type="button"
                            onClick={() => handleToggle(c.id)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title={c.isActive ? 'Tạm dừng mã' : 'Kích hoạt lại mã'}
                          >
                            {c.isActive ? <PauseCircle className="w-3.5 h-3.5 text-amber-600" /> : <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>

                          {/* Terminate immediately */}
                          {c.isActive && !isExpired && (
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ isOpen: true, type: 'TERMINATE', coupon: c })}
                              className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Kết thúc đợt khuyến mãi ngay"
                            >
                              <Ban className="w-3.5 h-3.5 text-amber-700" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-stone-500 hover:text-[#8C5D3B] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông số mã"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Soft disable */}
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ isOpen: true, type: 'DELETE', coupon: c })}
                            className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa / Vô hiệu hóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>Tổng cộng: {totalElements} mã ưu đãi</span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trước
              </Button>
              <span className="px-3 py-1 font-semibold text-stone-700 self-center">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Confirm Terminate / Delete */}
        {confirmModal.isOpen && confirmModal.coupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-amber-700">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">
                    {confirmModal.type === 'TERMINATE' ? 'Xác nhận kết thúc mã ưu đãi' : 'Xác nhận xóa / vô hiệu hóa mã'}
                  </h3>
                  <p className="text-xs text-stone-500">Mã: {confirmModal.coupon.code}</p>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {confirmModal.type === 'TERMINATE'
                  ? 'Thao tác này sẽ đóng đợt khuyến mãi ngay lập tức (đặt hạn kết thúc về thời điểm hiện tại và vô hiệu hóa mã). Khách hàng sẽ không thể áp dụng mã này nữa.'
                  : 'Nếu mã đã có lượt sử dụng trong các đơn hàng trước đó, hệ thống sẽ tự động chuyển sang chế độ vô hiệu hóa an toàn (soft disable) để bảo toàn lịch sử đơn hàng.'}
              </p>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmModal({ isOpen: false, type: 'TERMINATE', coupon: null })}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={actionLoading}
                  onClick={handleConfirmAction}
                >
                  Xác nhận thực hiện
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Create/Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <h3 className="font-serif-title text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
                {editingCoupon ? `Chỉnh Sửa Mã: ${editingCoupon.code}` : 'Tạo Mã Giảm Giá Mới'}
              </h3>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {!editingCoupon && (
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Mã Ưu Đãi * (Viết hoa, 3-20 ký tự)</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="VD: NOVELIA20, SPRING2026..."
                      className="w-full uppercase font-mono p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Loại Giảm Giá *</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B] bg-white"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {discountType === 'PERCENTAGE' ? 'Phần Trăm Giảm (%) *' : 'Số Tiền Giảm (VNĐ) *'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={discountType === 'PERCENTAGE' ? '100' : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Đơn Tối Thiểu (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Giảm Tối Đa (VNĐ - Tùy chọn)</label>
                    <input
                      type="number"
                      min="0"
                      value={maxDiscountAmount ?? ''}
                      onChange={(e) => setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Không giới hạn trần"
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Tổng Lượt Dùng Toàn Hệ Thống</label>
                    <input
                      type="number"
                      min="1"
                      value={usageLimit ?? ''}
                      onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Không giới hạn"
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Giới Hạn Mỗi Khách Hàng</label>
                    <input
                      type="number"
                      min="1"
                      value={usageLimitPerUser}
                      onChange={(e) => setUsageLimitPerUser(Number(e.target.value))}
                      placeholder="1 lần/khách"
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Ngày Bắt Đầu *</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Ngày Kết Thúc *</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#8C5D3B] focus:ring-[#8C5D3B]"
                  />
                  <label htmlFor="isActiveCheck" className="font-semibold text-stone-700 cursor-pointer">
                    Kích hoạt áp dụng mã ngay lập tức
                  </label>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={modalLoading}
                  >
                    {editingCoupon ? 'Cập Nhật' : 'Tạo Mới'}
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
