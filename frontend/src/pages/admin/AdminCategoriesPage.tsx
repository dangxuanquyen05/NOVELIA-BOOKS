import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminCategoryService } from '../../services/adminCategoryService';
import type { CategoryRequest } from '../../services/adminCategoryService';
import type { Category } from '../../types/book';
import { Button } from '../../components/ui/Button';
import {
  FolderTree,
  PlusCircle,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form state
  const [formData, setFormData] = useState<CategoryRequest>({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCategoryService.getCategories(false, false);
      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        setError(res.message || 'Không thể tải danh sách danh mục');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Lỗi khi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      displayOrder: cat.displayOrder || 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Vui lòng nhập tên danh mục');
    setSubmitting(true);
    try {
      const res = await adminCategoryService.createCategory({
        ...formData,
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        description: formData.description?.trim() || undefined,
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchCategories();
      } else {
        alert(res.message || 'Không thể tạo danh mục');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi tạo danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSubmitting(true);
    try {
      const res = await adminCategoryService.updateCategory(editingCategory.id, {
        ...formData,
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        description: formData.description?.trim() || undefined,
      });
      if (res.success) {
        setEditingCategory(null);
        fetchCategories();
      } else {
        alert(res.message || 'Không thể cập nhật danh mục');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setSubmitting(true);
    try {
      const res = await adminCategoryService.deleteCategory(deletingCategory.id);
      if (res.success) {
        showToast('Xóa danh mục thành công!');
        setDeletingCategory(null);
        fetchCategories();
      } else {
        showToast(res.message || 'Không thể xóa danh mục', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lỗi khi xóa danh mục', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.isActive !== false) ||
      (statusFilter === 'INACTIVE' && c.isActive === false);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout
      title="Quản Lý Danh Mục Thể Loại Sách"
      subtitle="Tổ chức cây phân loại, thứ tự hiển thị và kích hoạt danh mục trên toàn hệ thống"
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all animate-in slide-in-from-top-3 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700 backdrop-blur-md'
                : 'bg-rose-900/90 text-white border-rose-700 backdrop-blur-md'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc slug..."
              className="w-full sm:w-72 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8C5D3B] focus:bg-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-40 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none"
            >
              <option value="ALL">Tất cả ({categories.length})</option>
              <option value="ACTIVE">Đang hiển thị</option>
              <option value="INACTIVE">Đang ẩn</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchCategories}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Làm mới
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="bg-[#8C5D3B] hover:bg-[#142e22] text-white"
            >
              Thêm danh mục
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Categories Table */}
        <div className="bg-white rounded-2xl border border-[#E7E0D5] shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-[#E7E0D5] text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Tên danh mục</th>
                <th className="py-3.5 px-4">Đường dẫn tĩnh (Slug)</th>
                <th className="py-3.5 px-4">Mô tả</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C5D3B]" />
                    Đang tải danh mục...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    Chưa có danh mục nào trong hệ thống
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 text-[#8C5D3B] flex items-center justify-center font-bold text-xs shrink-0">
                          <FolderTree className="w-4 h-4 text-[#8C5D3B]" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{cat.name}</p>
                          <p className="text-[11px] text-stone-400 font-mono">ID: #{cat.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                      {cat.slug}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-stone-500 max-w-xs truncate">
                      {cat.description || '---'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {cat.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Hiển thị
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-500">
                          <XCircle className="w-3 h-3" /> Ẩn
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 text-stone-500 hover:text-[#8C5D3B] hover:bg-stone-100 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Create Category */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-serif-title font-bold text-lg text-stone-900">
                  Thêm Danh Mục Mới
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCreate} className="py-4 space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tên danh mục *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Văn học hiện đại..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Đường dẫn tĩnh (Slug)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Tự động tạo nếu để trống"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mô tả danh mục</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCreate"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#8C5D3B] focus:ring-[#8C5D3B]"
                  />
                  <label htmlFor="isActiveCreate" className="font-medium text-stone-700 cursor-pointer">
                    Kích hoạt hiển thị cho khách hàng
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
                    Tạo danh mục
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Category */}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-serif-title font-bold text-lg text-stone-900">
                  Chỉnh Sửa Danh Mục
                </h3>
                <button onClick={() => setEditingCategory(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="py-4 space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tên danh mục *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Đường dẫn tĩnh (Slug)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mô tả danh mục</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#8C5D3B] focus:ring-[#8C5D3B]"
                  />
                  <label htmlFor="isActiveEdit" className="font-medium text-stone-700 cursor-pointer">
                    Kích hoạt hiển thị cho khách hàng
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setEditingCategory(null)}>
                    Hủy bỏ
                  </Button>
                  <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
                    Cập nhật
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Delete Category */}
        {deletingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-serif-title font-bold text-lg text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" /> Xác Nhận Xóa Danh Mục
                </h3>
                <button onClick={() => setDeletingCategory(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 text-sm text-stone-600 space-y-2">
                <p>Bạn có chắc chắn muốn xóa danh mục: <strong>{deletingCategory.name}</strong>?</p>
                <p className="text-xs text-rose-600">
                  Các cuốn sách thuộc danh mục này sẽ không bị xóa nhưng cần được chuyển sang danh mục khác nếu cần.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <Button variant="secondary" size="sm" onClick={() => setDeletingCategory(null)}>
                  Hủy bỏ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={submitting}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
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
