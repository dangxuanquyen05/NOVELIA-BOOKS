import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, RefreshCw, X, Check, Search, BookOpen, AlertTriangle } from 'lucide-react';
import { bookService } from '../../services/bookService';
import type { Book, Category, PageResponse } from '../../types/book';
import { BookCard } from '../../components/common/BookCard';
import { SkeletonBookCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../contexts/CartContext';

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 100.000đ', min: undefined, max: 100000 },
  { label: 'Từ 100.000đ - 200.000đ', min: 100000, max: 200000 },
  { label: 'Từ 200.000đ - 300.000đ', min: 200000, max: 300000 },
  { label: 'Trên 300.000đ', min: 300000, max: undefined },
];

const SORT_OPTIONS = [
  { label: 'Mới nhất phát hành', value: 'newest' },
  { label: 'Giá tăng dần (Thấp -> Cao)', value: 'price_asc' },
  { label: 'Giá giảm dần (Cao -> Thấp)', value: 'price_desc' },
  { label: 'Đánh giá cao nhất', value: 'rating' },
  { label: 'Tiêu đề (A - Z)', value: 'title' },
];

export const BookListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [booksData, setBooksData] = useState<PageResponse<Book> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Search input local state
  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') || '');

  // Toast
  const [cartToast, setCartToast] = useState<{ show: boolean; title: string }>({ show: false, title: '' });

  // Read params from URL
  const currentKeyword = searchParams.get('keyword') || '';
  const currentCategorySlug = searchParams.get('category') || '';
  const currentMinPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const currentMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const currentSortBy = searchParams.get('sortBy') || 'newest';
  const currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 0;
  const PAGE_SIZE = 12;

  // Fetch Categories
  useEffect(() => {
    let isMounted = true;
    bookService.getCategories()
      .then((res) => {
        if (isMounted && res.success) {
          setCategories(res.data);
        }
      })
      .catch((err) => {
        console.error('Không thể tải danh mục:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Books whenever URL search params change
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookService.getBooks({
        keyword: currentKeyword || undefined,
        categorySlug: currentCategorySlug || undefined,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice,
        sortBy: currentSortBy,
        page: currentPage,
        size: PAGE_SIZE,
      });

      if (response.success) {
        setBooksData(response.data);
      } else {
        setError(response.message || 'Không thể tải danh sách sách.');
      }
    } catch (err: unknown) {
      console.error('Lỗi khi tải sách:', err);
      setError('Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [currentKeyword, currentCategorySlug, currentMinPrice, currentMaxPrice, currentSortBy, currentPage]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Update URL helper
  const updateUrlParams = (newParams: Record<string, string | number | undefined | null>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams);
  };

  // Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ keyword: searchInput.trim() || null, page: 0 });
  };

  const handleCategorySelect = (slug: string) => {
    updateUrlParams({
      category: currentCategorySlug === slug ? null : slug,
      page: 0,
    });
  };

  const handlePriceRangeSelect = (min?: number, max?: number) => {
    updateUrlParams({
      minPrice: min,
      maxPrice: max,
      page: 0,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrlParams({ sortBy: e.target.value, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const { addToCart } = useCart();

  const handleAddToCart = async (book: Book) => {
    const res = await addToCart(book.id, 1);
    if (res.success) {
      setCartToast({ show: true, title: book.title });
    } else {
      setCartToast({ show: true, title: res.message || 'Không thể thêm vào giỏ hàng' });
    }
    setTimeout(() => {
      setCartToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const hasActiveFilters = Boolean(currentKeyword || currentCategorySlug || currentMinPrice || currentMaxPrice);

  return (
    <div className="py-8 sm:py-12 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {cartToast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#1C1917] text-white shadow-2xl border border-white/10 animate-fade-in max-w-sm">
          <div className="w-7 h-7 rounded-full bg-[#8C5D3B] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white">Đã thêm vào giỏ hàng:</p>
            <p className="text-stone-300 line-clamp-1">{cartToast.title}</p>
          </div>
          <button
            onClick={() => setCartToast({ show: false, title: '' })}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Breadcrumbs matching screenshot */}
      <div className="space-y-3">
        <nav className="flex items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-[#8C5D3B] transition">Trang chủ</Link>
          <span>›</span>
          <span className="text-[#1C1917] font-semibold">Sách</span>
          {currentCategorySlug && (
            <>
              <span>›</span>
              <span className="text-[#8C5D3B] font-bold">
                {categories.find((c) => c.slug === currentCategorySlug)?.name || currentCategorySlug}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
          <div>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
              Tất cả sách
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
              Khám phá hàng ngàn cuốn sách từ nhiều thể loại khác nhau
            </p>
          </div>

          {/* Quick Search inside list */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm sách, tác giả..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-[#E2DDD5] text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-[#8C5D3B]"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      </div>

      {/* Main Grid: Sidebar + Book List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="hidden lg:block space-y-6 bg-white rounded-2xl p-6 border border-[#EBE5DC] shadow-xs sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C5D3B]">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Bộ Lọc Tuyển Chọn</span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-[#8C5D3B] hover:underline font-semibold"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Filter: Categories */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-sm font-bold text-[#1C1917]">Danh Mục</h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateUrlParams({ category: null, page: 0 })}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                  !currentCategorySlug
                    ? 'bg-[#8C5D3B] text-white font-bold shadow-xs'
                    : 'text-stone-700 hover:bg-[#F4EFEB]'
                }`}
              >
                <span>Tất cả danh mục</span>
              </button>

              {categories.map((cat) => {
                const isSelected = currentCategorySlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#8C5D3B] text-white font-bold shadow-xs'
                        : 'text-stone-700 hover:bg-[#F4EFEB]'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter: Price Range */}
          <div className="space-y-3 pt-3 border-t border-[#F0EBE3]">
            <h4 className="font-serif-title text-sm font-bold text-[#1C1917]">Khoảng Giá (VNĐ)</h4>
            <div className="space-y-1.5">
              {PRICE_RANGES.map((range, idx) => {
                const isSelected = currentMinPrice === range.min && currentMaxPrice === range.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePriceRangeSelect(range.min, range.max)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF0E6] text-[#8C5D3B] font-bold border border-[#E8D7C5]'
                        : 'text-stone-700 hover:bg-[#F4EFEB]'
                    }`}
                  >
                    <span>{range.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#8C5D3B]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <section className="lg:col-span-3 space-y-6">
          {/* Controls Bar: Mobile filter trigger + Sorter */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#EBE5DC] shadow-xs">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF0E6] text-[#8C5D3B] text-xs font-semibold cursor-pointer border border-[#E8D7C5]"
            >
              <Filter className="w-4 h-4" />
              <span>Bộ lọc ({hasActiveFilters ? 'Đang lọc' : 'Tất cả'})</span>
            </button>

            {/* Active Filters Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-500 hidden sm:inline">Hiển thị:</span>
              <span className="font-bold text-[#8C5D3B] font-mono">
                {booksData?.totalElements || 0}
              </span>
              <span className="text-stone-500">tác phẩm</span>

              {currentKeyword && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                  Từ khóa: "{currentKeyword}"
                  <button onClick={() => updateUrlParams({ keyword: null, page: 0 })}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}

              {currentCategorySlug && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#8C5D3B] border border-[#E8D7C5] text-[11px]">
                  Danh mục: {categories.find(c => c.slug === currentCategorySlug)?.name || currentCategorySlug}
                  <button onClick={() => updateUrlParams({ category: null, page: 0 })}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}
            </div>

            {/* Sorter Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <label htmlFor="sortBy" className="text-xs text-stone-600 font-medium hidden sm:inline">
                Sắp xếp:
              </label>
              <select
                id="sortBy"
                value={currentSortBy}
                onChange={handleSortChange}
                className="text-xs font-semibold text-stone-800 bg-[#FAF7F2] border border-[#E0D9CE] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#8C5D3B] cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BOOKS CONTENT STATES */}
          {isLoading ? (
            /* Loading Skeleton Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonBookCard key={i} />
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-serif-title text-base font-bold text-rose-900">
                Không thể tải dữ liệu sách
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchBooks}
              >
                Thử Lại Ngay
              </Button>
            </div>
          ) : !booksData || booksData.content.length === 0 ? (
            /* Empty State */
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-stone-400" />}
              title="Không tìm thấy tác phẩm phù hợp"
              description="Hãy thử thay đổi từ khóa tìm kiếm, mở rộng khoảng giá hoặc chọn danh mục khác."
              actionText="Xóa tất cả bộ lọc"
              onAction={handleResetFilters}
            />
          ) : (
            /* Book Grid */
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {booksData.content.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onAddToCart={handleAddToCart}
                    onQuickView={(b: Book) => alert(`Tác phẩm: ${b.title}\nISBN: ${b.isbn}\nGiá: ${b.salePrice}đ`)}
                  />
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {booksData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-[#EAE4DC]">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={booksData.isFirst}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Trang Trước
                  </Button>

                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: booksData.totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePageChange(idx)}
                        className={`w-8 h-8 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          currentPage === idx
                            ? 'bg-[#8C5D3B] text-white font-bold shadow-xs'
                            : 'bg-white text-stone-700 hover:bg-[#F4EFEB] border border-[#E7E0D5]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={booksData.isLast}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Trang Kế
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* MOBILE DRAWER FILTER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto max-w-xs w-full bg-[#FBF9F5] p-6 shadow-2xl flex flex-col space-y-6 z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4DC]">
              <h3 className="font-serif-title text-base font-bold text-[#1C1917]">
                Bộ Lọc Tuyển Chọn
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg text-stone-600 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-[#8C5D3B]">Danh Mục</h4>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    updateUrlParams({ category: null, page: 0 });
                    setIsMobileFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                    !currentCategorySlug ? 'bg-[#8C5D3B] text-white font-bold' : 'hover:bg-[#F4EFEB]'
                  }`}
                >
                  Tất cả danh mục
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      handleCategorySelect(c.slug);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                      currentCategorySlug === c.slug
                        ? 'bg-[#8C5D3B] text-white font-bold'
                        : 'hover:bg-[#F4EFEB]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Price */}
            <div className="space-y-2 pt-2 border-t border-[#EAE4DC]">
              <h4 className="font-bold text-xs uppercase text-[#8C5D3B]">Khoảng Giá</h4>
              <div className="space-y-1">
                {PRICE_RANGES.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handlePriceRangeSelect(r.min, r.max);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                      currentMinPrice === r.min && currentMaxPrice === r.max
                        ? 'bg-[#8C5D3B] text-white font-bold'
                        : 'hover:bg-[#F4EFEB]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAE4DC]">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Áp Dụng Bộ Lọc
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
