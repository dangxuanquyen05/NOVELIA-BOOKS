import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminAuditLogService } from '../../services/adminAuditLogService';
import type { AuditLog } from '../../types/auditLog';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Server,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe,
  Copy,
  Check
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [performedBy, setPerformedBy] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Dropdown options
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [page, selectedAction, selectedEntity, selectedStatus]);

  const loadOptions = async () => {
    try {
      const [actions, entities] = await Promise.all([
        adminAuditLogService.getAvailableActions(),
        adminAuditLogService.getAvailableEntityTypes()
      ]);
      setAvailableActions(actions || []);
      setAvailableEntities(entities || []);
    } catch (err: any) {
      console.warn('Could not load filter options:', err);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuditLogService.getAuditLogs({
        action: selectedAction || undefined,
        entityType: selectedEntity || undefined,
        performedBy: performedBy || undefined,
        status: selectedStatus || undefined,
        page,
        size: 15,
      });
      setLogs(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Truy cập bị từ chối: Chỉ Quản trị viên (ROLE_ADMIN) mới có quyền truy cập Nhật ký kiểm toán an ninh.');
      } else {
        setError(err.response?.data?.message || 'Không thể tải danh sách nhật ký kiểm toán. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadAuditLogs();
  };

  const handleResetFilters = () => {
    setPerformedBy('');
    setSelectedAction('');
    setSelectedEntity('');
    setSelectedStatus('');
    setPage(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('RECEIPT')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('ADJUST') || action.includes('THRESHOLD')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('DELETE') || action.includes('TERMINATE') || action.includes('CANCEL')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('MODERATE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-stone-100 text-stone-700 border-stone-200';
  };

  return (
    <AdminLayout
      title="Nhật ký kiểm toán an ninh"
      subtitle="Theo dõi, truy vết mọi hành vi quản trị, biến động dữ liệu và bảo đảm tính toàn vẹn hệ thống"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Tổng sự kiện</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{totalElements.toLocaleString()}</h3>
              <p className="text-xs text-stone-400 mt-0.5">Bản ghi append-only an toàn</p>
            </div>
            <div className="p-3 bg-stone-100 rounded-lg text-stone-700">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Biến động Sách & Kho</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">Đã kiểm soát</h3>
              <p className="text-xs text-stone-400 mt-0.5">Truy vết phiếu nhập & tồn kho</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <Server className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Đơn hàng & Khách</p>
              <h3 className="text-2xl font-bold text-blue-700 mt-1">Ghi nhận 100%</h3>
              <p className="text-xs text-stone-400 mt-0.5">Đổi trạng thái, hủy, khóa user</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Bảo mật dữ liệu</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">Redacted</h3>
              <p className="text-xs text-stone-400 mt-0.5">Tuyệt đối không lưu mật khẩu</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Email người thực hiện..."
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              >
                <option value="">Tất cả hành động</option>
                {availableActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              >
                <option value="">Tất cả đối tượng</option>
                {availableEntities.map((ent) => (
                  <option key={ent} value={ent}>
                    {ent}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="SUCCESS">SUCCESS (Thành công)</option>
                <option value="FAILED">FAILED (Thất bại)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Lọc
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg text-sm transition-colors"
                title="Làm mới bộ lọc"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lỗi bảo mật hoặc kết nối</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Người thực hiện</th>
                  <th className="py-3.5 px-4">Hành động</th>
                  <th className="py-3.5 px-4">Đối tượng</th>
                  <th className="py-3.5 px-4">Nội dung tóm tắt</th>
                  <th className="py-3.5 px-4">IP</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-stone-200 rounded w-28"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-stone-200 rounded w-36"></div></td>
                      <td className="py-4 px-4"><div className="h-5 bg-stone-200 rounded w-24"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-stone-200 rounded w-20"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-stone-200 rounded w-48"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-stone-200 rounded w-16"></div></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 bg-stone-200 rounded w-14 mx-auto"></div></td>
                      <td className="py-4 px-4 text-right"><div className="h-6 bg-stone-200 rounded w-8 ml-auto"></div></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <FileText className="w-12 h-12 text-stone-300 mb-3" />
                        <p className="font-medium text-stone-700">Chưa có bản ghi nhật ký phù hợp</p>
                        <p className="text-xs text-stone-400 mt-1">
                          Hãy thử điều chỉnh bộ lọc hoặc chọn khoảng thời gian khác.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-50/60 transition-colors cursor-pointer group"
                      onClick={() => setSelectedLog(item)}
                    >
                      <td className="py-3.5 px-4 text-xs font-mono text-stone-600 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-800 text-white flex items-center justify-center text-[10px] font-bold">
                            {item.performedBy?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-stone-900 text-xs">
                            {item.performedBy}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getActionBadgeColor(item.action)}`}>
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-stone-700 whitespace-nowrap">
                        <span className="font-semibold text-stone-900">{item.entityType}</span>
                        {item.entityId && (
                          <span className="text-stone-400 ml-1">#{item.entityId}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-700 max-w-xs truncate" title={item.summary}>
                        {item.summary}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-stone-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3 h-3 text-stone-400" />
                          {item.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(item);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <div>
                Trang <span className="font-semibold text-stone-900">{page + 1}</span> / {totalPages} (Tổng số {totalElements} sự kiện)
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 border border-stone-200 rounded-md hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  className="px-3 py-1.5 border border-stone-200 rounded-md hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-stone-900 text-white rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">Chi tiết sự kiện kiểm toán #{selectedLog.id}</h3>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <p className="text-xs text-stone-500 uppercase font-medium">Người thực hiện</p>
                  <p className="font-semibold text-stone-900 mt-0.5">{selectedLog.performedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase font-medium">Địa chỉ IP</p>
                  <p className="font-mono text-stone-900 mt-0.5">{selectedLog.ipAddress || '127.0.0.1'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase font-medium">Hành động</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mt-1 ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase font-medium">Đối tượng</p>
                  <p className="font-mono text-stone-900 mt-0.5">
                    {selectedLog.entityType} {selectedLog.entityId && `#${selectedLog.entityId}`}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Tóm tắt hành động</p>
                <p className="text-stone-900 mt-1 font-medium bg-white p-3 rounded-lg border border-stone-200">
                  {selectedLog.summary}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Chi tiết kỹ thuật</p>
                  {selectedLog.details && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedLog.details || '')}
                      className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  )}
                </div>
                <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {selectedLog.details || 'Không có chi tiết bổ sung'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
