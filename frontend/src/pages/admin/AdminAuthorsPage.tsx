import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminAuthorService } from '../../services/adminAuthorService';
import type { AuthorRequest } from '../../services/adminAuthorService';
import type { Author } from '../../types/book';
import { Button } from '../../components/ui/Button';
import {
  Feather,
  PlusCircle,
  RefreshCw,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Globe,
  CheckCircle2
} from 'lucide-react';

export const AdminAuthorsPage: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [deletingAuthor, setDeletingAuthor] = useState<Author | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form state
  const [formData, setFormData] = useState<AuthorRequest>({
    name: '',
    slug: '',
    biography: '',
    avatarUrl: '',
    nationality: 'Việt Nam',
  });

  const fetchAuthors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuthorService.getAuthors();
      if (res.success && res.data) {
        setAuthors(res.data);
      } else {
        setError(res.message || 'Không thể tải danh sách tác giả');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Lỗi khi tải tác giả');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      biography: '',
      avatarUrl: '',
      nationality: 'Việt Nam',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (author: Author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      slug: author.slug,
      biography: author.biography || '',
      avatarUrl: author.avatarUrl || '',
      nationality: author.nationality || 'Việt Nam',
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Vui lòng nhập tên tác giả');
    setSubmitting(true);
    try {
      const res = await adminAuthorService.createAuthor({
        ...formData,
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        biography: formData.biography?.trim() || undefined,
        avatarUrl: formData.avatarUrl?.trim() || undefined,
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchAuthors();
      } else {
        alert(res.message || 'Không thể tạo tác giả');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi tạo tác giả');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuthor) return;
    setSubmitting(true);
    try {
      const res = await adminAuthorService.updateAuthor(editingAuthor.id, {
        ...formData,
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        biography: formData.biography?.trim() || undefined,
        avatarUrl: formData.avatarUrl?.trim() || undefined,
      });
      if (res.success) {
        setEditingAuthor(null);
        fetchAuthors();
      } else {
        alert(res.message || 'Không thể cập nhật tác giả');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật tác giả');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAuthor) return;
    setSubmitting(true);
    try {
      const res = await adminAuthorService.deleteAuthor(deletingAuthor.id);
      if (res.success) {
        showToast('Xóa tác giả thành công!');
        setDeletingAuthor(null);
        fetchAuthors();
      } else {
        showToast(res.message || 'Không thể xóa tác giả', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lỗi khi xóa tác giả', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAuthors = authors.filter((a) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(query) ||
      (a.nationality && a.nationality.toLowerCase().includes(query)) ||
      a.slug.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout
      title="Quản Lý Hồ Sơ Tác Giả"
      subtitle="Hồ sơ danh nhân, nhà văn, tiểu sử và thông tin tác quyền các tác giả sách"
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
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tác giả, quốc tịch, slug..."
            className="w-full sm:w-80 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8C5D3B] focus:bg-white"
          />

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAuthors}
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
              Thêm tác giả
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Authors Grid / Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Tác giả</th>
                <th className="py-3.5 px-4">Quốc tịch</th>
                <th className="py-3.5 px-4">Đường dẫn (Slug)</th>
                <th className="py-3.5 px-4">Tiểu sử</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {loading && authors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C5D3B]" />
                    Đang tải tác giả...
                  </td>
                </tr>
              ) : filteredAuthors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    Chưa có tác giả nào phù hợp trong hệ thống
                  </td>
                </tr>
              ) : (
                filteredAuthors.map((author) => (
                  <tr key={author.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {author.avatarUrl ? (
                          <img
                            src={author.avatarUrl}
                            alt={author.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#8C5D3B]/10 text-[#8C5D3B] flex items-center justify-center font-bold text-xs shrink-0">
                            <Feather className="w-4 h-4 text-[#8C5D3B]" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-stone-900">{author.name}</p>
                          <p className="text-[11px] text-stone-400 font-mono">ID: #{author.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-stone-700">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-stone-400" />
                        {author.nationality || 'Chưa rõ'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                      {author.slug}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-stone-500 max-w-sm truncate">
                      {author.biography || 'Chưa có thông tin tiểu sử'}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(author)}
                          className="p-1.5 text-stone-500 hover:text-[#8C5D3B] hover:bg-stone-100 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingAuthor(author)}
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

        {/* Modal Create Author */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-serif-title font-bold text-lg text-stone-900">
                  Thêm Tác Giả Mới
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCreate} className="py-4 space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tên tác giả *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Nam Cao..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Quốc tịch</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Ảnh chân dung (URL)</label>
                  <input
                    type="text"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tiểu sử vắn tắt</label>
                  <textarea
                    rows={3}
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    placeholder="Năm sinh, sự nghiệp văn chương..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
                    Lưu tác giả
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Author */}
        {editingAuthor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-serif-title font-bold text-lg text-stone-900">
                  Chỉnh Sửa Tác Giả: {editingAuthor.name}
                </h3>
                <button onClick={() => setEditingAuthor(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="py-4 space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tên tác giả *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Quốc tịch</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Ảnh chân dung (URL)</label>
                  <input
                    type="text"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tiểu sử</label>
                  <textarea
                    rows={3}
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:border-[#8C5D3B] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setEditingAuthor(null)}>
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

        {/* Modal Delete Author */}
        {deletingAuthor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-serif-title font-bold text-lg text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" /> Xác Nhận Xóa Tác Giả
                </h3>
                <button onClick={() => setDeletingAuthor(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 text-sm text-stone-600 space-y-2">
                <p>Bạn có chắc chắn muốn xóa tác giả: <strong>{deletingAuthor.name}</strong>?</p>
                <p className="text-xs text-rose-600">
                  Hành động này sẽ gỡ bỏ liên kết tác giả khỏi các cuốn sách hiện có.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <Button variant="secondary" size="sm" onClick={() => setDeletingAuthor(null)}>
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
