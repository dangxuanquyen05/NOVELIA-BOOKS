import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminCustomerService } from '../../services/adminCustomerService';
import type { CustomerItem, CustomerDetail } from '../../types/customer';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  RefreshCw,
  Lock,
  Unlock,
  ShoppingBag,
  Mail,
  Phone,
  CheckCircle2,
  X,
  Eye,
  AlertTriangle,
  User,
  MapPin,
  Calendar
} from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal Detail
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal Confirm Lock/Unlock
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [modalMode, setModalMode] = useState<'LOCK' | 'UNLOCK' | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [lockError, setLockError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; isError?: boolean }>({
    show: false,
    message: '',
  });

  const showToast = (message: string, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const fetchCustomers = async (
    page: number = currentPage,
    search: string = keyword,
    status: string = statusFilter,
    role: string = roleFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCustomerService.getCustomers({
        keyword: search || undefined,
        status,
        role,
        page,
        size: pageSize,
      });
      if (res.success && res.data) {
        setCustomers(res.data.content);
        setTotalElements(res.data.totalElements);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.pageNumber);
      } else {
        setError(res.message || 'Không thể nạp danh sách khách hàng');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Lỗi khi kết nối đến máy chủ';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage, keyword, statusFilter, roleFilter);
  }, [currentPage, keyword, statusFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setKeyword(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setKeyword('');
    setStatusFilter('ALL');
    setRoleFilter('ALL');
    setCurrentPage(0);
  };

  // Xem chi tiết khách hàng với lịch sử đơn hàng thật
  const handleOpenDetailModal = async (customer: CustomerItem) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await adminCustomerService.getCustomerDetails(customer.id);
      if (res.success && res.data) {
        setSelectedDetail(res.data);
      } else {
        showToast(res.message || 'Không thể tải chi tiết người dùng', true);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi tải chi tiết khách hàng', true);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Mở modal xác nhận Khóa / Mở khóa
  const handleOpenStatusModal = (customer: CustomerItem, mode: 'LOCK' | 'UNLOCK') => {
    if (!isAdmin) {
      showToast('Chỉ Quản trị viên (ROLE_ADMIN) mới có quyền khóa/mở khóa tài khoản!', true);
      return;
    }

    if (currentUser?.email && customer.email.toLowerCase() === currentUser.email.toLowerCase()) {
      showToast('Bạn không thể tự khóa hoặc vô hiệu hóa tài khoản quản trị của chính mình!', true);
      return;
    }

    setSelectedCustomer(customer);
    setModalMode(mode);
    setLockReason('');
    setLockError(null);
  };

  // Thực hiện đổi trạng thái tài khoản
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !modalMode) return;

    const newStatus = modalMode === 'LOCK' ? 'LOCKED' : 'ACTIVE';
    setActionLoadingId(selectedCustomer.id);
    setLockError(null);

    try {
      const res = await adminCustomerService.updateCustomerStatus(
        selectedCustomer.id,
        newStatus,
        lockReason.trim() || undefined
      );

      if (res.success) {
        showToast(
          `Đã ${modalMode === 'LOCK' ? 'khóa' : 'mở khóa'} thành công tài khoản người dùng: ${selectedCustomer.fullName}`
        );
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? { ...c, status: newStatus } : c))
        );
        setSelectedCustomer(null);
        setModalMode(null);
      } else {
        setLockError(res.message || 'Không thể cập nhật trạng thái');
      }
    } catch (err: any) {
      setLockError(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật trạng thái khách hàng');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Thống kê nhanh
  const countActive = customers.filter((c) => c.status === 'ACTIVE').length;
  const countLocked = customers.filter((c) => c.status === 'LOCKED').length;
  const countWithOrders = customers.filter((c) => c.totalOrders > 0).length;

  return (
    <AdminLayout
      title="Quản Lý Khách Hàng"
      subtitle={`Theo dõi danh sách ${totalElements} tài khoản người dùng, phân quyền bảo mật và lịch sử mua hàng thực tế`}
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
            <div className="w-10 h-10 rounded-xl bg-[#1B3B2B]/10 text-[#1B3B2B] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Tổng Tài Khoản</p>
              <p className="text-lg font-bold text-[#1C1917]">{totalElements}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Đang Hoạt Động</p>
              <p className="text-lg font-bold text-[#1C1917]">{countActive}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Đang Bị Khóa</p>
              <p className="text-lg font-bold text-[#1C1917]">{countLocked}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E7E0D5] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-stone-500 font-medium">Đã Có Đơn Hàng</p>
              <p className="text-lg font-bold text-[#1C1917]">{countWithOrders}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
                className="w-full text-xs rounded-xl border border-[#D5CDC0] pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#1B3B2B] bg-[#FAFAF8]"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Tìm Kiếm
            </Button>
            {(keyword || statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
              <Button type="button" variant="outline" size="md" onClick={handleResetFilters}>
                Xóa Bộ Lọc
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => fetchCustomers(currentPage, keyword, statusFilter, roleFilter)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Làm Mới
            </Button>
          </form>

          {/* Filter Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#F0EBE3]">
            {/* Filter Status */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Trạng thái tài khoản
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Tất cả trạng thái', value: 'ALL' },
                  { label: 'Hoạt động (ACTIVE)', value: 'ACTIVE' },
                  { label: 'Bị khóa (LOCKED)', value: 'LOCKED' },
                  { label: 'Chưa kích hoạt (INACTIVE)', value: 'INACTIVE' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(t.value);
                      setCurrentPage(0);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      statusFilter === t.value
                        ? 'bg-[#1B3B2B] text-white shadow-xs'
                        : 'bg-[#FAFAF8] text-stone-600 border border-[#E7E0D5] hover:border-stone-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Role */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Vai trò người dùng
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Tất cả vai trò', value: 'ALL' },
                  { label: 'Khách hàng', value: 'ROLE_CUSTOMER' },
                  { label: 'Nhân viên', value: 'ROLE_STAFF' },
                  { label: 'Quản trị viên', value: 'ROLE_ADMIN' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setRoleFilter(t.value);
                      setCurrentPage(0);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      roleFilter === t.value
                        ? 'bg-[#B88E52] text-white shadow-xs'
                        : 'bg-[#FAFAF8] text-stone-600 border border-[#E7E0D5] hover:border-stone-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchCustomers()} className="font-semibold underline ml-4">
              Thử lại
            </button>
          </div>
        )}

        {/* Customers Table */}
        <div className="bg-white rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
          {loading && customers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#1B3B2B]/20 border-t-[#1B3B2B] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-500">Đang tải danh sách người dùng...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <User className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500">Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại.</p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7FAF8] border-b border-[#E7E0D5] text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 sm:px-6">Người Dùng</th>
                    <th className="py-3.5 px-4">Thông Tin Liên Hệ</th>
                    <th className="py-3.5 px-4">Vai Trò</th>
                    <th className="py-3.5 px-4 text-center">Đơn Đã Đặt</th>
                    <th className="py-3.5 px-4 text-right">Tổng Chi Tiêu</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE3]">
                  {customers.map((c) => {
                    const isSelf = currentUser?.email && c.email.toLowerCase() === currentUser.email.toLowerCase();

                    return (
                      <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1B3B2B]/10 text-[#1B3B2B] flex items-center justify-center font-bold text-sm shrink-0 border border-[#1B3B2B]/20">
                              {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-[#1C1917] flex items-center gap-1.5">
                                {c.fullName || 'Chưa đặt tên'}
                                {isSelf && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Bạn
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-stone-400 font-mono">
                                Đăng ký: {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="font-medium">{c.email}</span>
                          </div>
                          {c.phone ? (
                            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="font-mono">{c.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">Chưa có SĐT</span>
                          )}
                        </td>

                        {/* Roles */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {c.roles.map((r) => (
                              <span
                                key={r}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  r === 'ROLE_ADMIN'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : r === 'ROLE_STAFF'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                                }`}
                              >
                                {r.replace('ROLE_', '')}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Orders count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F7FAF8] border border-[#E7E0D5] font-semibold text-stone-800">
                            <ShoppingBag className="w-3 h-3 text-[#B88E52]" />
                            {c.totalOrders}
                          </span>
                        </td>

                        {/* Total Spent */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1B3B2B]">
                          {formatCurrencyVND(c.totalSpent || 0)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {c.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hoạt động
                            </span>
                          ) : c.status === 'LOCKED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <Lock className="w-3 h-3 text-rose-600" /> Bị khóa
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                              {c.status}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Nút Xem Chi Tiết */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(c)}
                              className="p-1.5 rounded-lg border border-stone-200 hover:bg-white text-stone-600 hover:text-[#1B3B2B]"
                              title="Xem chi tiết lịch sử đơn hàng & mua sắm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Nút Khóa / Mở Khóa (Chỉ ADMIN và không được tự khóa chính mình) */}
                            {isSelf ? (
                              <span className="text-[10px] text-stone-400 italic">Tài khoản của bạn</span>
                            ) : !isAdmin ? (
                              <span className="text-[10px] text-stone-400 italic">Chỉ đọc</span>
                            ) : c.status === 'ACTIVE' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                onClick={() => handleOpenStatusModal(c, 'LOCK')}
                                isLoading={actionLoadingId === c.id}
                                leftIcon={<Lock className="w-3 h-3" />}
                              >
                                Khóa
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenStatusModal(c, 'UNLOCK')}
                                isLoading={actionLoadingId === c.id}
                                leftIcon={<Unlock className="w-3 h-3 text-emerald-600" />}
                              >
                                Mở khóa
                              </Button>
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
                Hiển thị trang <strong>{currentPage + 1}</strong> / {totalPages} (Tổng số {totalElements} khách hàng)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1 || loading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Chi Tiết Khách Hàng (Customer Detail Modal) */}
        {detailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setDetailModalOpen(false)} />
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 border border-[#E7E0D5] z-10 max-h-[90vh] overflow-y-auto animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88E52]">
                    Hồ Sơ Chi Tiết Khách Hàng
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <h3 className="font-bold text-lg sm:text-xl text-[#1B3B2B]">
                      {selectedDetail?.fullName || 'Đang tải...'}
                    </h3>
                    {selectedDetail?.status === 'ACTIVE' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        {selectedDetail?.status}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetail || !selectedDetail ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#1B3B2B]/20 border-t-[#1B3B2B] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-stone-500">Đang tải thông tin chi tiết và lịch sử đơn hàng...</p>
                </div>
              ) : (
                <div className="space-y-6 text-xs">
                  {/* Cards Profile & Purchasing Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Thông tin liên hệ */}
                    <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E7E0D5] space-y-2">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                        <User className="w-3.5 h-3.5 text-[#B88E52]" /> Thông Tin Tài Khoản
                      </span>
                      <p><strong>Email:</strong> {selectedDetail.email}</p>
                      <p><strong>Số điện thoại:</strong> {selectedDetail.phone || 'Chưa cập nhật'}</p>
                      <p><strong>Ngày đăng ký:</strong> {new Date(selectedDetail.createdAt).toLocaleString('vi-VN')}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <strong>Vai trò:</strong>
                        {selectedDetail.roles.map((r) => (
                          <span key={r} className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px] font-bold">
                            {r.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tổng quan mua hàng thực tế */}
                    <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E7E0D5] space-y-2">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#B88E52]" /> Tổng Quan Mua Sắm Thực Tế
                      </span>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Tổng số đơn hàng:</span>
                        <span className="font-bold text-stone-900">{selectedDetail.totalOrders} đơn</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Đơn giao thành công:</span>
                        <span className="font-bold text-emerald-700">{selectedDetail.completedOrders} đơn</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Tổng chi tiêu thực:</span>
                        <span className="font-mono font-bold text-[#1B3B2B] text-sm">
                          {formatCurrencyVND(selectedDetail.totalSpent || 0)}
                        </span>
                      </div>
                      {selectedDetail.lastOrderDate && (
                        <div className="flex justify-between text-[11px] pt-1 border-t border-[#E7E0D5]">
                          <span className="text-stone-500">Lần đặt gần nhất:</span>
                          <span className="text-stone-600">{new Date(selectedDetail.lastOrderDate).toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sổ địa chỉ đã lưu */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#B88E52]" /> Sổ Địa Chỉ Nhận Hàng (
                      {selectedDetail.addresses?.length || 0})
                    </h4>
                    {!selectedDetail.addresses || selectedDetail.addresses.length === 0 ? (
                      <p className="text-stone-400 italic p-3 bg-stone-50 rounded-xl border border-stone-200">
                        Khách hàng chưa lưu sổ địa chỉ nào.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedDetail.addresses.map((addr) => (
                          <div key={addr.id} className="p-3 bg-white rounded-xl border border-[#E7E0D5] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#1C1917]">{addr.receiverName}</span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-stone-500 font-mono text-[11px]">{addr.phone}</p>
                            <p className="text-stone-600 text-[11px]">{addr.fullAddress}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lịch sử đơn hàng gần nhất */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#B88E52]" /> Lịch Sử Đơn Hàng Gần Đây (
                      {selectedDetail.recentOrders?.length || 0})
                    </h4>

                    {!selectedDetail.recentOrders || selectedDetail.recentOrders.length === 0 ? (
                      <p className="text-stone-400 italic p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
                        Khách hàng chưa phát sinh đơn hàng nào trên hệ thống.
                      </p>
                    ) : (
                      <div className="border border-[#E7E0D5] rounded-2xl overflow-hidden divide-y divide-[#F0EBE3]">
                        {selectedDetail.recentOrders.map((ord) => (
                          <div key={ord.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-stone-50/50">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-[#1B3B2B] block">{ord.orderNumber}</span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(ord.createdAt).toLocaleString('vi-VN')} • {ord.paymentMethod} ({ord.paymentStatus})
                              </span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="font-mono font-bold text-[#1C1917] block">
                                {formatCurrencyVND(ord.totalAmount)}
                              </span>
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                                {ord.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end pt-3 border-t border-[#F0EBE3]">
                    <Button variant="secondary" size="md" onClick={() => setDetailModalOpen(false)}>
                      Đóng
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Xác Nhận Khóa / Mở Khóa Tài Khoản */}
        {selectedCustomer && modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => {
                setSelectedCustomer(null);
                setModalMode(null);
              }}
            />
            <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E7E0D5] z-10 space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                <div className="flex items-center gap-2.5">
                  {modalMode === 'LOCK' ? (
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Unlock className="w-5 h-5" />
                    </div>
                  )}
                  <h3 className="font-bold text-base text-[#1C1917]">
                    {modalMode === 'LOCK' ? 'Khóa Tài Khoản Người Dùng' : 'Mở Khóa Tài Khoản'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setModalMode(null);
                  }}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {lockError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{lockError}</span>
                </div>
              )}

              <form onSubmit={handleStatusChange} className="space-y-4 text-xs">
                <div className="p-3 bg-[#FAFAF8] rounded-2xl border border-[#E7E0D5] space-y-1">
                  <p><strong>Khách hàng:</strong> {selectedCustomer.fullName}</p>
                  <p><strong>Email:</strong> {selectedCustomer.email}</p>
                  <p><strong>Tổng số đơn đã đặt:</strong> {selectedCustomer.totalOrders} đơn hàng</p>
                </div>

                {modalMode === 'LOCK' ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Lưu ý quy tắc bảo mật:
                    </p>
                    <p>
                      Khi bị khóa, khách hàng sẽ không thể đăng nhập hoặc tạo đơn mới. <strong>Toàn bộ lịch sử đơn hàng và chi tiêu vẫn được lưu trữ nguyên vẹn</strong>, không bị xóa bỏ.
                    </p>
                  </div>
                ) : (
                  <p className="text-stone-600">
                    Mở khóa sẽ cho phép tài khoản đăng nhập và đặt mua sách trở lại bình thường trên hệ thống Novelia.
                  </p>
                )}

                {modalMode === 'LOCK' && (
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700">Lý do khóa tài khoản (lưu vết kiểm toán):</label>
                    <textarea
                      rows={3}
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="Ví dụ: Gian lận đơn hàng, spam tài khoản, yêu cầu từ khách..."
                      className="w-full rounded-xl border border-[#D5CDC0] p-2.5 text-xs focus:outline-none focus:border-[#1B3B2B] bg-[#FAFAF8]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0EBE3]">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    disabled={actionLoadingId !== null}
                    onClick={() => {
                      setSelectedCustomer(null);
                      setModalMode(null);
                    }}
                  >
                    Hủy Bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className={modalMode === 'LOCK' ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600' : undefined}
                    size="md"
                    isLoading={actionLoadingId !== null}
                  >
                    {actionLoadingId !== null
                      ? 'Đang xử lý...'
                      : modalMode === 'LOCK'
                      ? 'Xác Nhận Khóa'
                      : 'Xác Nhận Mở Khóa'}
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
