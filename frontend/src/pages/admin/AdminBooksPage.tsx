import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { bookService } from '../../services/bookService';
import { adminBookService } from '../../services/adminBookService';
import type { BookCreateRequest, BookUpdateRequest } from '../../services/adminBookService';
import type { Book, Category, Author } from '../../types/book';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { ImageUploader } from '../../components/admin/ImageUploader';
import {
  Search,
  PlusCircle,
  RefreshCw,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Star,
  BookOpen,
  CheckCircle,
  FileText,
  AlertCircle,
  Copy,
  Check,
  Filter,
  Sparkles,
  ArrowUpDown,
  Info
} from 'lucide-react';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const AdminBooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedIsbn, setCopiedIsbn] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    coverImage: '',
    publisher: 'NXB Văn Học',
    publicationYear: new Date().getFullYear(),
    pages: 280,
    dimensions: '14 x 20.5 cm',
    coverType: 'PAPERBACK',
    originalPrice: 120000,
    salePrice: 105000,
    shortDescription: '',
    description: '',
    status: 'PUBLISHED',
    isFeatured: false,
    authorIds: [] as number[],
    categoryIds: [] as number[],
    stockQuantity: 50,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchBooks = async (page: number = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookService.getBooks({
        keyword: keyword || undefined,
        categoryId: selectedCategoryId,
        authorId: selectedAuthorId,
        status: selectedStatus || undefined,
        sortBy: sortBy,
        page,
        size: pageSize,
      });

      if (res.success && res.data) {
        setBooks(res.data.content);
        setTotalElements(res.data.totalElements);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.pageNumber);
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Không thể tải danh sách sách';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [catRes, authRes] = await Promise.all([
        bookService.getCategories(),
        bookService.getAuthors(),
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (authRes.success && authRes.data) setAuthors(authRes.data);
    } catch (e) {
      console.error('Lỗi khi tải danh mục và tác giả', e);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchBooks(currentPage);
  }, [currentPage, pageSize, keyword, selectedCategoryId, selectedAuthorId, selectedStatus, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setKeyword(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('');
    setCurrentPage(0);
  };

  const copyToClipboard = (isbn: string) => {
    navigator.clipboard.writeText(isbn);
    setCopiedIsbn(isbn);
    setTimeout(() => setCopiedIsbn(null), 2000);
  };

  const generateRandomIsbn = () => {
    const prefix = '978';
    const randPart = Math.floor(100000000 + Math.random() * 900000000).toString();
    const sum = (prefix + randPart).split('').reduce((acc, curr, idx) => {
      return acc + parseInt(curr) * (idx % 2 === 0 ? 1 : 3);
    }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    const fullIsbn = `${prefix}${randPart}${checkDigit}`;
    setFormData((prev) => ({ ...prev, isbn: fullIsbn }));
    if (formErrors.isbn) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.isbn;
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề sách không được để trống';
    } else if (formData.title.length > 255) {
      errors.title = 'Tiêu đề sách không được vượt quá 255 ký tự';
    }

    const cleanIsbn = formData.isbn.replace(/[\s-]+/g, '');
    if (!cleanIsbn) {
      errors.isbn = 'Mã ISBN không được để trống';
    } else if (!/^(97(8|9))?\d{9}(\d|X)$/i.test(cleanIsbn)) {
      errors.isbn = 'Mã ISBN phải chuẩn 10 hoặc 13 chữ số';
    }

    if (formData.authorIds.length === 0) {
      errors.authorIds = 'Vui lòng chọn ít nhất một tác giả';
    }

    if (formData.categoryIds.length === 0) {
      errors.categoryIds = 'Vui lòng chọn ít nhất một danh mục';
    }

    if (formData.originalPrice < 0) {
      errors.originalPrice = 'Giá bìa không được âm';
    }

    if (formData.salePrice < 0) {
      errors.salePrice = 'Giá bán không được âm';
    }

    if (formData.salePrice > formData.originalPrice) {
      errors.salePrice = 'Giá bán không được lớn hơn giá bìa (giá gốc)';
    }

    if (formData.stockQuantity < 0) {
      errors.stockQuantity = 'Số lượng tồn kho không được là số âm';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateModal = () => {
    setFormErrors({});
    setFormData({
      title: '',
      isbn: '978' + Math.floor(1000000000 + Math.random() * 9000000000),
      coverImage: '',
      publisher: 'NXB Văn Học',
      publicationYear: new Date().getFullYear(),
      pages: 280,
      dimensions: '14 x 20.5 cm',
      coverType: 'PAPERBACK',
      originalPrice: 120000,
      salePrice: 105000,
      shortDescription: '',
      description: '',
      status: 'PUBLISHED',
      isFeatured: false,
      authorIds: authors.length > 0 ? [authors[0].id] : [],
      categoryIds: categories.length > 0 ? [categories[0].id] : [],
      stockQuantity: 50,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setFormErrors({});
    setEditingBook(book);
    setFormData({
      title: book.title,
      isbn: book.isbn,
      coverImage: book.coverImage || '',
      publisher: book.publisher || 'NXB Văn Học',
      publicationYear: book.publicationYear || new Date().getFullYear(),
      pages: book.pages || 250,
      dimensions: book.dimensions || '14 x 20.5 cm',
      coverType: book.coverType || 'PAPERBACK',
      originalPrice: book.originalPrice,
      salePrice: book.salePrice,
      shortDescription: book.shortDescription || '',
      description: book.description || '',
      status: book.status || 'PUBLISHED',
      isFeatured: book.isFeatured || false,
      authorIds: book.authors?.map((a) => a.id) || [],
      categoryIds: book.categories?.map((c) => c.id) || [],
      stockQuantity: book.stockQuantity || 0,
    });
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: BookCreateRequest = {
        title: formData.title.trim(),
        isbn: formData.isbn.replace(/[\s-]+/g, ''),
        coverImage: formData.coverImage.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        publicationYear: Number(formData.publicationYear),
        pages: Number(formData.pages),
        dimensions: formData.dimensions,
        coverType: formData.coverType,
        originalPrice: Number(formData.originalPrice),
        salePrice: Number(formData.salePrice),
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
        authorIds: formData.authorIds,
        categoryIds: formData.categoryIds,
        initialStock: Number(formData.stockQuantity),
      };

      const res = await adminBookService.createBook(payload);
      if (res.success) {
        setIsCreateModalOpen(false);
        showToast('Thêm sách mới thành công!');
        fetchBooks(0);
      } else {
        showToast(res.message || 'Không thể tạo sách mới', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lỗi khi tạo sách', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: BookUpdateRequest = {
        title: formData.title.trim(),
        isbn: formData.isbn.replace(/[\s-]+/g, ''),
        coverImage: formData.coverImage.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        publicationYear: Number(formData.publicationYear),
        pages: Number(formData.pages),
        dimensions: formData.dimensions,
        coverType: formData.coverType,
        originalPrice: Number(formData.originalPrice),
        salePrice: Number(formData.salePrice),
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
        authorIds: formData.authorIds,
        categoryIds: formData.categoryIds,
        stockQuantity: Number(formData.stockQuantity),
      };

      const res = await adminBookService.updateBook(editingBook.id, payload);
      if (res.success) {
        setEditingBook(null);
        showToast('Cập nhật thông tin sách thành công!');
        fetchBooks(currentPage);
      } else {
        showToast(res.message || 'Không thể cập nhật sách', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật sách', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (book: Book, newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    try {
      const res = await adminBookService.updateBookStatus(book.id, newStatus);
      if (res.success) {
        showToast(`Đã chuyển trạng thái sang: ${newStatus === 'PUBLISHED' ? 'Đang kinh doanh' : newStatus === 'DRAFT' ? 'Bản nháp' : 'Lưu trữ'}`);
        fetchBooks(currentPage);
      } else {
        showToast(res.message || 'Lỗi khi đổi trạng thái', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lỗi khi đổi trạng thái', 'error');
    }
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    setSubmitting(true);
    try {
      const res = await adminBookService.deleteBook(deletingBook.id);
      if (res.success) {
        const msg = res.data || res.message || 'Thao tác xóa / lưu trữ sách thành công';
        showToast(msg);
        setDeletingBook(null);
        fetchBooks(currentPage);
      } else {
        showToast(res.message || 'Không thể xóa sách', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Lỗi khi xóa sách', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const published = books.filter((b) => b.status === 'PUBLISHED').length;
    const draft = books.filter((b) => b.status === 'DRAFT').length;
    const archived = books.filter((b) => b.status === 'ARCHIVED').length;
    const lowStock = books.filter((b) => (b.stockQuantity || 0) <= 10).length;
    return { published, draft, archived, lowStock };
  }, [books]);

  return (
    <AdminLayout
      title="Quản Lý Danh Mục Sách & Tác Phẩm"
      subtitle="Thiết lập danh mục sản phẩm, quản lý ISBN, định giá bán, ảnh bìa và phân quyền trạng thái kinh doanh"
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
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B3B2B]/10 text-[#1B3B2B] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider">Tổng tựa sách</p>
              <p className="text-xl font-bold font-serif-title text-stone-900">{totalElements}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider">Đang kinh doanh</p>
              <p className="text-xl font-bold font-serif-title text-emerald-700">{stats.published}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider">Bản nháp (Draft)</p>
              <p className="text-xl font-bold font-serif-title text-amber-700">{stats.draft}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider">Tồn kho thấp (&le;10)</p>
              <p className="text-xl font-bold font-serif-title text-rose-700">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm tựa sách, mã ISBN, tác giả..."
                className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#1B3B2B] focus:bg-white transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchBooks(currentPage)}
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
                className="bg-[#1B3B2B] hover:bg-[#142e22] text-white shadow-sm"
              >
                Thêm sách mới
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1.5 text-stone-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-stone-400" /> Bộ lọc:
            </span>

            {/* Category Filter */}
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined);
                setCurrentPage(0);
              }}
              className="py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:border-[#1B3B2B]"
            >
              <option value="">Tất cả danh mục ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Author Filter */}
            <select
              value={selectedAuthorId || ''}
              onChange={(e) => {
                setSelectedAuthorId(e.target.value ? Number(e.target.value) : undefined);
                setCurrentPage(0);
              }}
              className="py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:border-[#1B3B2B]"
            >
              <option value="">Tất cả tác giả ({authors.length})</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(0);
              }}
              className="py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:border-[#1B3B2B]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đang xuất bản (PUBLISHED)</option>
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="ARCHIVED">Lưu trữ / Ngừng KD (ARCHIVED)</option>
            </select>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(0);
                }}
                className="py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:border-[#1B3B2B]"
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="title_asc">Tên sách: A &rarr; Z</option>
                <option value="title_desc">Tên sách: Z &rarr; A</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Books Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Tác phẩm & ISBN</th>
                  <th className="py-3.5 px-4">Tác giả & Phân loại</th>
                  <th className="py-3.5 px-4 text-right">Giá niêm yết / Giá bán</th>
                  <th className="py-3.5 px-4 text-center">Tồn kho</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                {loading && books.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-stone-400">
                      <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-[#1B3B2B]" />
                      <p className="font-medium">Đang tải cơ sở dữ liệu sách...</p>
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-stone-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 stroke-1 text-stone-300" />
                      <p className="font-medium text-stone-600">Không tìm thấy cuốn sách nào phù hợp</p>
                      <p className="text-xs text-stone-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ các tiêu chí lọc</p>
                    </td>
                  </tr>
                ) : (
                  books.map((b) => {
                    const discountPercent =
                      b.originalPrice > b.salePrice
                        ? Math.round(((b.originalPrice - b.salePrice) / b.originalPrice) * 100)
                        : 0;

                    return (
                      <tr key={b.id} className="hover:bg-stone-50/80 transition-colors group">
                        {/* Book Title & Cover */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="relative shrink-0 w-12 h-16 rounded-md overflow-hidden bg-stone-100 border border-stone-200 shadow-xs">
                              <img
                                src={b.coverImage || FALLBACK_COVER}
                                alt={b.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = FALLBACK_COVER;
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif-title font-bold text-stone-900 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                                {b.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                                  ISBN: {b.isbn || '---'}
                                  {b.isbn && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(b.isbn)}
                                      className="text-stone-400 hover:text-stone-700 ml-0.5"
                                      title="Sao chép ISBN"
                                    >
                                      {copiedIsbn === b.isbn ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </span>
                                {b.publisher && (
                                  <span className="text-[11px] text-stone-400 font-sans">
                                    &bull; {b.publisher}
                                  </span>
                                )}
                                {b.coverType && (
                                  <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded font-sans">
                                    {b.coverType === 'HARDCOVER' ? 'Bìa cứng' : 'Bìa mềm'}
                                  </span>
                                )}
                                {b.isFeatured && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Nổi bật
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Authors & Categories */}
                        <td className="py-4 px-4 text-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-stone-800">
                              {b.authors?.map((a) => a.name).join(', ') || 'Chưa có tác giả'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {b.categories && b.categories.length > 0 ? (
                                b.categories.map((c) => (
                                  <span
                                    key={c.id}
                                    className="inline-block px-1.5 py-0.2 text-[10px] font-medium bg-stone-100 text-stone-600 rounded"
                                  >
                                    {c.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-stone-400">Chưa phân loại</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-stone-900 text-sm sm:text-base">
                            {formatCurrencyVND(b.salePrice)}
                          </p>
                          {b.originalPrice > b.salePrice && (
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span className="text-[11px] text-stone-400 line-through">
                                {formatCurrencyVND(b.originalPrice)}
                              </span>
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 rounded">
                                -{discountPercent}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-full text-xs font-bold ${
                              (b.stockQuantity || 0) === 0
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : (b.stockQuantity || 0) <= 10
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                            title={`Tồn kho: ${b.stockQuantity || 0} cuốn`}
                          >
                            {(b.stockQuantity || 0) === 0 ? 'Hết' : b.stockQuantity}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-block relative">
                            <select
                              value={b.status || 'PUBLISHED'}
                              onChange={(e) => handleQuickStatusChange(b, e.target.value as any)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                                b.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : b.status === 'DRAFT'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-stone-100 text-stone-600 border-stone-300'
                              }`}
                            >
                              <option value="PUBLISHED">Đang bán</option>
                              <option value="DRAFT">Bản nháp</option>
                              <option value="ARCHIVED">Lưu trữ</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(b)}
                              className="p-2 text-stone-500 hover:text-[#1B3B2B] hover:bg-[#1B3B2B]/10 rounded-lg transition-colors"
                              title="Chỉnh sửa toàn bộ thông tin"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingBook(b)}
                              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa hoặc lưu trữ ngừng kinh doanh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <span>
                  Trang <strong>{currentPage + 1}</strong> / <strong>{totalPages}</strong> ({totalElements} cuốn sách)
                </span>
                <span className="text-stone-300">&bull;</span>
                <div className="flex items-center gap-1">
                  <span>Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                    className="py-1 px-2 bg-stone-50 border border-stone-200 rounded-md text-stone-700 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>dòng/trang</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 0 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                >
                  Trang trước
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i;
                    if (totalPages > 5 && currentPage > 2) {
                      pageNum = Math.min(currentPage - 2 + i, totalPages - 1);
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#1B3B2B] text-white shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages - 1 || loading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Trang tiếp
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Thêm sách mới */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 my-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#1B3B2B]/10 text-[#1B3B2B] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-title font-bold text-lg text-stone-900">
                      Thêm Tựa Sách Mới
                    </h3>
                    <p className="text-xs text-stone-500">Nhập đầy đủ thông tin xuất bản, định giá và thiết lập kho hàng</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCreate} className="py-4 space-y-5 text-xs sm:text-sm">
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-stone-700 mb-1">
                        Tiêu đề tựa sách *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          if (formErrors.title) {
                            const errs = { ...formErrors };
                            delete errs.title;
                            setFormErrors(errs);
                          }
                        }}
                        placeholder="Nhập tên tựa sách đầy đủ..."
                        className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                          formErrors.title ? 'border-rose-400 bg-rose-50/50' : 'border-stone-200 focus:border-[#1B3B2B]'
                        }`}
                      />
                      {formErrors.title && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.title}</p>
                      )}
                    </div>

                    {/* ISBN with Generator Button */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-stone-700">Mã ISBN (10 hoặc 13 số) *</label>
                        <button
                          type="button"
                          onClick={generateRandomIsbn}
                          className="text-[11px] text-[#1B3B2B] hover:underline flex items-center gap-1 font-medium"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" /> Tạo tự động
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.isbn}
                        onChange={(e) => {
                          setFormData({ ...formData, isbn: e.target.value });
                          if (formErrors.isbn) {
                            const errs = { ...formErrors };
                            delete errs.isbn;
                            setFormErrors(errs);
                          }
                        }}
                        placeholder="9786045638101"
                        className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl font-mono focus:bg-white focus:outline-none transition-all ${
                          formErrors.isbn ? 'border-rose-400 bg-rose-50/50' : 'border-stone-200 focus:border-[#1B3B2B]'
                        }`}
                      />
                      {formErrors.isbn && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.isbn}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Trạng thái phát hành *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#1B3B2B]"
                      >
                        <option value="PUBLISHED">Đang xuất bản & Mở bán (PUBLISHED)</option>
                        <option value="DRAFT">Bản nháp / Chưa mở bán (DRAFT)</option>
                        <option value="ARCHIVED">Lưu trữ / Tạm ngừng kinh doanh (ARCHIVED)</option>
                      </select>
                    </div>

                    {/* Authors (Multi-select) */}
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Tác giả *</label>
                      <select
                        multiple
                        value={formData.authorIds.map(String)}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                          setFormData({ ...formData, authorIds: selected });
                          if (formErrors.authorIds) {
                            const errs = { ...formErrors };
                            delete errs.authorIds;
                            setFormErrors(errs);
                          }
                        }}
                        className={`w-full px-3 py-2 bg-stone-50 border rounded-xl h-24 focus:bg-white focus:outline-none ${
                          formErrors.authorIds ? 'border-rose-400' : 'border-stone-200 focus:border-[#1B3B2B]'
                        }`}
                      >
                        {authors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.nationality || 'Việt Nam'})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-400 mt-0.5">Giữ phím Ctrl / Command để chọn nhiều tác giả</p>
                      {formErrors.authorIds && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.authorIds}</p>
                      )}
                    </div>

                    {/* Categories (Multi-select) */}
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Danh mục thể loại *</label>
                      <select
                        multiple
                        value={formData.categoryIds.map(String)}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                          setFormData({ ...formData, categoryIds: selected });
                          if (formErrors.categoryIds) {
                            const errs = { ...formErrors };
                            delete errs.categoryIds;
                            setFormErrors(errs);
                          }
                        }}
                        className={`w-full px-3 py-2 bg-stone-50 border rounded-xl h-24 focus:bg-white focus:outline-none ${
                          formErrors.categoryIds ? 'border-rose-400' : 'border-stone-200 focus:border-[#1B3B2B]'
                        }`}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-400 mt-0.5">Giữ phím Ctrl / Command để chọn nhiều danh mục</p>
                      {formErrors.categoryIds && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.categoryIds}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Cover Image Upload */}
                <div className="p-4 bg-stone-50/70 border border-stone-200 rounded-2xl">
                  <ImageUploader
                    value={formData.coverImage}
                    onChange={(url) => setFormData({ ...formData, coverImage: url })}
                  />
                </div>

                {/* 3. Pricing & Inventory */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Giá bìa (VNĐ) *</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.originalPrice}
                      onChange={(e) => {
                        setFormData({ ...formData, originalPrice: Number(e.target.value) });
                        if (formErrors.originalPrice) {
                          const errs = { ...formErrors };
                          delete errs.originalPrice;
                          setFormErrors(errs);
                        }
                      }}
                      className={`w-full px-3 py-2 bg-stone-50 border rounded-xl focus:bg-white focus:outline-none font-semibold ${
                        formErrors.originalPrice ? 'border-rose-400' : 'border-stone-200 focus:border-[#1B3B2B]'
                      }`}
                    />
                    {formErrors.originalPrice && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.originalPrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Giá bán ra (VNĐ) *</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.salePrice}
                      onChange={(e) => {
                        setFormData({ ...formData, salePrice: Number(e.target.value) });
                        if (formErrors.salePrice) {
                          const errs = { ...formErrors };
                          delete errs.salePrice;
                          setFormErrors(errs);
                        }
                      }}
                      className={`w-full px-3 py-2 bg-stone-50 border rounded-xl focus:bg-white focus:outline-none font-semibold text-emerald-800 ${
                        formErrors.salePrice ? 'border-rose-400' : 'border-stone-200 focus:border-[#1B3B2B]'
                      }`}
                    />
                    {formErrors.salePrice && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.salePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Số lượng kho ban đầu *</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stockQuantity}
                      onChange={(e) => {
                        setFormData({ ...formData, stockQuantity: Number(e.target.value) });
                        if (formErrors.stockQuantity) {
                          const errs = { ...formErrors };
                          delete errs.stockQuantity;
                          setFormErrors(errs);
                        }
                      }}
                      className={`w-full px-3 py-2 bg-stone-50 border rounded-xl focus:bg-white focus:outline-none font-semibold ${
                        formErrors.stockQuantity ? 'border-rose-400' : 'border-stone-200 focus:border-[#1B3B2B]'
                      }`}
                    />
                    {formErrors.stockQuantity && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.stockQuantity}</p>
                    )}
                  </div>
                </div>

                {/* 4. Publishing Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Nhà xuất bản</label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Năm xuất bản</label>
                    <input
                      type="number"
                      value={formData.publicationYear}
                      onChange={(e) => setFormData({ ...formData, publicationYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Số trang</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.pages}
                      onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Loại bìa</label>
                    <select
                      value={formData.coverType}
                      onChange={(e) => setFormData({ ...formData, coverType: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="PAPERBACK">Bìa mềm</option>
                      <option value="HARDCOVER">Bìa cứng cao cấp</option>
                    </select>
                  </div>
                </div>

                {/* 5. Descriptions & Featured */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Mô tả ngắn (Tóm tắt)</label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="Tóm tắt ngắn gọn nội dung tác phẩm (1-2 câu)..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Mô tả chi tiết tác phẩm</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Giới thiệu đầy đủ, đánh giá hoặc mục lục tác phẩm..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="create-isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#1B3B2B] focus:ring-[#1B3B2B]"
                    />
                    <label htmlFor="create-isFeatured" className="text-xs font-semibold text-stone-800 cursor-pointer">
                      Đánh dấu là tác phẩm nổi bật (Hiển thị trang chủ)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={submitting}
                    className="bg-[#1B3B2B] hover:bg-[#142e22] text-white"
                  >
                    Lưu tựa sách mới
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Chỉnh sửa sách */}
        {editingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 my-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-title font-bold text-lg text-stone-900 truncate max-w-md">
                      Chỉnh Sửa Sách: {editingBook.title}
                    </h3>
                    <p className="text-xs text-stone-500">Cập nhật giá bán, số lượng tồn kho, bìa sách và trạng thái kinh doanh</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="py-4 space-y-5 text-xs sm:text-sm">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-stone-700 mb-1">
                        Tiêu đề tựa sách *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          if (formErrors.title) {
                            const errs = { ...formErrors };
                            delete errs.title;
                            setFormErrors(errs);
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                          formErrors.title ? 'border-rose-400 bg-rose-50/50' : 'border-stone-200 focus:border-[#1B3B2B]'
                        }`}
                      />
                      {formErrors.title && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Mã ISBN *</label>
                      <input
                        type="text"
                        value={formData.isbn}
                        onChange={(e) => {
                          setFormData({ ...formData, isbn: e.target.value });
                          if (formErrors.isbn) {
                            const errs = { ...formErrors };
                            delete errs.isbn;
                            setFormErrors(errs);
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl font-mono focus:bg-white focus:outline-none transition-all ${
                          formErrors.isbn ? 'border-rose-400 bg-rose-50/50' : 'border-stone-200 focus:border-[#1B3B2B]'
                        }`}
                      />
                      {formErrors.isbn && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.isbn}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Trạng thái phát hành *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#1B3B2B]"
                      >
                        <option value="PUBLISHED">Đang xuất bản & Mở bán (PUBLISHED)</option>
                        <option value="DRAFT">Bản nháp / Chưa mở bán (DRAFT)</option>
                        <option value="ARCHIVED">Lưu trữ / Tạm ngừng kinh doanh (ARCHIVED)</option>
                      </select>
                    </div>

                    {/* Authors Multi-select */}
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Tác giả *</label>
                      <select
                        multiple
                        value={formData.authorIds.map(String)}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                          setFormData({ ...formData, authorIds: selected });
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl h-24 focus:bg-white focus:outline-none"
                      >
                        {authors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.nationality || 'Việt Nam'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Categories Multi-select */}
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Danh mục thể loại *</label>
                      <select
                        multiple
                        value={formData.categoryIds.map(String)}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                          setFormData({ ...formData, categoryIds: selected });
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl h-24 focus:bg-white focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="p-4 bg-stone-50/70 border border-stone-200 rounded-2xl">
                  <ImageUploader
                    value={formData.coverImage}
                    onChange={(url) => setFormData({ ...formData, coverImage: url })}
                  />
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Giá bìa (VNĐ) *</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Giá bán ra (VNĐ) *</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold text-emerald-800 focus:bg-white focus:outline-none"
                    />
                    {formErrors.salePrice && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.salePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Additional details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Nhà xuất bản</label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Năm xuất bản</label>
                    <input
                      type="number"
                      value={formData.publicationYear}
                      onChange={(e) => setFormData({ ...formData, publicationYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Số trang</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.pages}
                      onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Loại bìa</label>
                    <select
                      value={formData.coverType}
                      onChange={(e) => setFormData({ ...formData, coverType: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="PAPERBACK">Bìa mềm</option>
                      <option value="HARDCOVER">Bìa cứng cao cấp</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Mô tả ngắn</label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Mô tả chi tiết</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="edit-isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#1B3B2B] focus:ring-[#1B3B2B]"
                    />
                    <label htmlFor="edit-isFeatured" className="text-xs font-semibold text-stone-800 cursor-pointer">
                      Đánh dấu là tác phẩm nổi bật (Hiển thị trang chủ)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setEditingBook(null)}>
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={submitting}
                    className="bg-[#1B3B2B] hover:bg-[#142e22] text-white"
                  >
                    Lưu cập nhật
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Xác nhận Xóa / Ngừng kinh doanh */}
        {deletingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h3 className="font-serif-title font-bold text-lg text-stone-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" /> Xác Nhận Xóa / Ngừng Kinh Doanh
                </h3>
                <button
                  type="button"
                  onClick={() => setDeletingBook(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 text-xs sm:text-sm text-stone-600 space-y-3">
                <p>Bạn có chắc chắn muốn xóa tựa sách này khỏi danh mục hoạt động?</p>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <p className="font-semibold text-stone-900">{deletingBook.title}</p>
                  <p className="text-stone-500 font-mono text-xs">ISBN: {deletingBook.isbn || 'Chưa có'}</p>
                  <p className="text-stone-500 text-xs">
                    Tác giả: {deletingBook.authors?.map((a) => a.name).join(', ') || 'Chưa cập nhật'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Quy tắc bảo vệ đơn hàng:</strong> Nếu sách này đã từng được đặt mua trong các đơn hàng, hệ thống sẽ tự động chuyển sang trạng thái <strong>Lưu trữ (ngừng kinh doanh)</strong> thay vì xóa cứng nhằm bảo toàn trọn vẹn dữ liệu kế toán và lịch sử giao dịch.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <Button variant="secondary" size="sm" onClick={() => setDeletingBook(null)}>
                  Hủy bỏ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteBook}
                  isLoading={submitting}
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  Xác nhận thực hiện
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
