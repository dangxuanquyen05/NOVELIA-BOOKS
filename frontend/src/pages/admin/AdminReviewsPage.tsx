import React, { useEffect, useState } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Trash2,
  User,
  Search,
  ShieldCheck,
  MessageSquare,
  Clock,
  Filter
} from 'lucide-react';
import { adminReviewService } from '../../services/adminReviewService';
import type { Review, ReviewStatus } from '../../types/review';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Reject Modal
  const [rejectingReview, setRejectingReview] = useState<Review | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Delete Confirm Modal
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const ratingParam = ratingFilter === 'ALL' ? undefined : ratingFilter;
      const keywordParam = searchKeyword.trim() ? searchKeyword.trim() : undefined;

      const res = await adminReviewService.getAllReviews(
        statusParam,
        undefined, // bookId
        ratingParam,
        keywordParam,
        page,
        10
      );
      setReviews(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchReviews();
  };

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    try {
      await adminReviewService.moderateReview(id, { status: 'APPROVED' });
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể duyệt đánh giá');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (review: Review) => {
    setRejectingReview(review);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingReview) return;
    if (!rejectionReason.trim()) {
      alert('Vui lòng nêu rõ lý do từ chối đánh giá.');
      return;
    }

    setActionLoadingId(rejectingReview.id);
    try {
      await adminReviewService.moderateReview(rejectingReview.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      });
      setRejectingReview(null);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể từ chối đánh giá');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    setDeleteLoading(true);
    try {
      await adminReviewService.deleteReview(deletingReview.id);
      setDeletingReview(null);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa đánh giá');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Stats calculation
  const pendingCount = reviews.filter(r => r.status === 'PENDING').length;
  const approvedCount = reviews.filter(r => r.status === 'APPROVED').length;
  const verifiedCount = reviews.filter(r => r.isVerifiedPurchase).length;

  return (
    <AdminLayout title="Kiểm Duyệt Đánh Giá Độc Giả" subtitle="Kiểm tra tính xác thực, nội dung phản hồi từ người mua thật và duyệt đánh giá trước khi xuất bản">
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tổng nhận xét</span>
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-stone-900 mt-2">{totalElements}</p>
            <p className="text-[11px] text-stone-400 mt-1">Lượt đánh giá từ độc giả</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Chờ kiểm duyệt</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-amber-800 mt-2">{pendingCount}</p>
            <p className="text-[11px] text-amber-600 mt-1">Cần ban quản trị xác nhận</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Đã phê duyệt</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-emerald-800 mt-2">{approvedCount}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Đang hiển thị công khai trên web</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Người mua đã xác thực</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif-title font-bold text-blue-900 mt-2">{verifiedCount}</p>
            <p className="text-[11px] text-blue-600 mt-1">Đơn hàng Đã giao thành công</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setStatusFilter('ALL'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#8C5D3B] shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('PENDING'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Chờ kiểm duyệt</span>
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('APPROVED'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'APPROVED'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã duyệt</span>
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('REJECTED'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'REJECTED'
                  ? 'bg-white text-red-800 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Đã từ chối</span>
            </button>
          </div>

          {/* Rating filter & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                  setPage(0);
                }}
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 focus:outline-none focus:border-[#8C5D3B]"
              >
                <option value="ALL">Tất cả số sao</option>
                <option value={5}>5 sao (Rất hài lòng)</option>
                <option value={4}>4 sao (Hài lòng)</option>
                <option value={3}>3 sao (Bình thường)</option>
                <option value={2}>2 sao (Chưa tốt)</option>
                <option value={1}>1 sao (Thất vọng)</option>
              </select>
            </div>

            <form onSubmit={handleSearch} className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm sách, độc giả, từ khóa..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#8C5D3B] bg-stone-50 shadow-2xs"
              />
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchReviews}
              isLoading={loading}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Reviews List Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-[#FAF7F2] text-stone-700 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Tác Phẩm & Độc Giả</th>
                  <th className="py-3.5 px-4">Đánh Giá</th>
                  <th className="py-3.5 px-4">Nội Dung Nhận Xét</th>
                  <th className="py-3.5 px-4">Xác Thực Mua Hàng</th>
                  <th className="py-3.5 px-4">Trạng Thái & Kiểm Duyệt</th>
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <div className="w-6 h-6 border-2 border-[#8C5D3B]/20 border-t-[#8C5D3B] rounded-full animate-spin mx-auto mb-2" />
                      Đang tải danh sách đánh giá...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="font-bold text-[#1C1917] line-clamp-1 block text-sm">
                          {r.bookTitle || `Tác phẩm #${r.bookId}`}
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-stone-500 mt-1 text-[11px]">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{r.userFullName || 'Độc giả'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">{r.rating}/5 sao</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-stone-700 leading-relaxed line-clamp-3">
                          {r.comment}
                        </p>
                        {r.rejectionReason && (
                          <div className="mt-1 p-2 rounded-lg bg-red-50 border border-red-100 text-[11px] text-red-700">
                            <strong>Lý do từ chối:</strong> {r.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {r.isVerifiedPurchase ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            Đã mua hàng
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">Chưa xác thực</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          {r.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã Duyệt
                            </span>
                          )}
                          {r.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" />
                              Chờ Duyệt
                            </span>
                          )}
                          {r.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              Từ Chối
                            </span>
                          )}
                        </div>
                        {r.moderatedBy && (
                          <p className="text-[10px] text-stone-400 mt-1">
                            Bởi: {r.moderatedBy.split('@')[0]}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                        <p>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                        <p className="text-[10px] text-stone-400">{new Date(r.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {r.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(r.id)}
                            disabled={actionLoadingId === r.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Duyệt
                          </button>
                        )}
                        {r.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(r)}
                            disabled={actionLoadingId === r.id}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Từ Chối
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingReview(r)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>Tổng cộng: {totalElements} đánh giá</span>
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

        {/* Reject Modal */}
        {rejectingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-700">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">Từ Chối Đánh Giá</h3>
                  <p className="text-xs text-stone-500">{rejectingReview.bookTitle}</p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                <p className="font-semibold text-stone-800 mb-1">Nội dung nhận xét của độc giả:</p>
                <p className="italic">"{rejectingReview.comment}"</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Lý do từ chối kiểm duyệt * (Bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="VD: Chứa ngôn từ không phù hợp, spam quảng cáo, không liên quan đến tác phẩm..."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#8C5D3B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectingReview(null)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={actionLoadingId === rejectingReview.id}
                  onClick={handleConfirmReject}
                >
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deletingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-700">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900">Xóa Đánh Giá Vĩnh Viễn</h3>
                  <p className="text-xs text-stone-500">Mã đánh giá #{deletingReview.id}</p>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa đánh giá này? Điểm đánh giá trung bình và số lượng nhận xét của tác phẩm sẽ được tự động tính toán lại ngay sau khi xóa.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeletingReview(null)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={deleteLoading}
                  onClick={handleConfirmDelete}
                >
                  Xác nhận xóa
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
