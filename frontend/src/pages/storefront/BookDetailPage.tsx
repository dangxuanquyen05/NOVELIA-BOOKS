import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, BookOpen, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { bookService } from '../../services/bookService';
import type { Book } from '../../types/book';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { BookSampleModal } from '../../components/common/BookSampleModal';
import { BookCard } from '../../components/common/BookCard';
import { reviewService } from '../../services/reviewService';
import type { Review, BookReviewSummary } from '../../types/review';
import { NOVELIA_BESTSELLERS } from '../../data/noveliaBooksData';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const BookDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_COVER);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isWishlisted = book ? isInWishlist(book.id) : false;

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<BookReviewSummary | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);

    bookService.getBookBySlugOrId(slug)
      .then((res) => {
        if (res.success && res.data) {
          setBook(res.data);
          setImgSrc(res.data.coverImage || FALLBACK_COVER);
          loadReviews(res.data.id);
          bookService.getRelatedBooks(res.data.slug, 4)
            .then((relRes) => {
              if (relRes.success && relRes.data) {
                setRelatedBooks(relRes.data);
              }
            })
            .catch(() => setRelatedBooks(NOVELIA_BESTSELLERS.filter((b) => b.slug !== slug).slice(0, 4)));
        } else {
          // Check local curated catalogue
          const localMatch = NOVELIA_BESTSELLERS.find((b) => b.slug === slug || b.id.toString() === slug);
          if (localMatch) {
            setBook(localMatch);
            setImgSrc(localMatch.coverImage || FALLBACK_COVER);
            setRelatedBooks(NOVELIA_BESTSELLERS.filter((b) => b.slug !== slug).slice(0, 4));
          } else {
            setError(res.message || 'Không tìm thấy thông tin tác phẩm.');
          }
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải chi tiết sách:', err);
        const localMatch = NOVELIA_BESTSELLERS.find((b) => b.slug === slug || b.id.toString() === slug);
        if (localMatch) {
          setBook(localMatch);
          setImgSrc(localMatch.coverImage || FALLBACK_COVER);
          setRelatedBooks(NOVELIA_BESTSELLERS.filter((b) => b.slug !== slug).slice(0, 4));
        } else {
          setError('Tác phẩm không tồn tại hoặc đã ngừng xuất bản.');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const loadReviews = async (bookId: number) => {
    try {
      const [reviewPage, summary] = await Promise.all([
        reviewService.getBookReviews(bookId, 0, 10),
        reviewService.getBookReviewSummary(bookId),
      ]);
      setReviews(reviewPage.content || []);
      setReviewSummary(summary);
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    if (!newComment.trim() || newComment.trim().length < 10) {
      setReviewErrorMsg('Vui lòng viết nhận xét từ 10 ký tự trở lên.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewErrorMsg(null);
    setReviewSuccessMsg(null);

    try {
      await reviewService.createReview(book.id, {
        rating: newRating,
        comment: newComment.trim(),
      });
      setNewComment('');
      setReviewSuccessMsg('Đánh giá của bạn đã được gửi thành công! Đánh giá sẽ hiển thị công khai sau khi được ban biên tập kiểm duyệt.');
      loadReviews(book.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể gửi đánh giá lúc này.';
      setReviewErrorMsg(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!book || book.stockQuantity <= 0) return;
    const res = await addToCart(book.id, quantity);
    if (res.success) {
      setToastMessage(`Đã thêm ${quantity} cuốn "${book.title}" vào giỏ hàng`);
    } else {
      setToastMessage(res.message || 'Không thể thêm vào giỏ hàng');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-4 w-48 bg-stone-200 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 aspect-[3/4] bg-stone-200 rounded-3xl" />
          <div className="lg:col-span-7 space-y-6">
            <div className="h-6 w-32 bg-stone-200 rounded-full" />
            <div className="h-10 w-3/4 bg-stone-200 rounded-lg" />
            <div className="h-4 w-1/2 bg-stone-200 rounded-md" />
            <div className="h-12 w-40 bg-stone-200 rounded-lg" />
            <div className="h-32 w-full bg-stone-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="py-20 text-center space-y-6 max-w-lg mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="font-serif-title text-2xl font-bold text-stone-900">
          Không tìm thấy tác phẩm
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          {error || 'Tác phẩm bạn đang tìm kiếm có thể đã thay đổi đường dẫn hoặc tạm thời ngừng kinh doanh.'}
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/books')}
          >
            Quay lại tủ sách
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = book.stockQuantity <= 0;
  const discountPercent = book.originalPrice && book.originalPrice > book.salePrice
    ? Math.round(((book.originalPrice - book.salePrice) / book.originalPrice) * 100)
    : 0;

  const authorsString = book.authors && book.authors.length > 0
    ? book.authors.map((a) => a.name).join(', ')
    : 'Tác giả NOVELIA';

  const categoryName = book.categories && book.categories.length > 0
    ? book.categories[0].name
    : 'Sách Tuyển Chọn';

  return (
    <div className="py-8 sm:py-12 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#1C1917] text-white shadow-2xl border border-white/10 animate-fade-in max-w-md">
          <div className="w-8 h-8 rounded-full bg-[#8C5D3B] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white">Thành công:</p>
            <p className="text-[#D4AF7A]">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation matching screenshot */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-[#8C5D3B] transition">Trang chủ</Link>
        <span>›</span>
        <Link to="/books" className="hover:text-[#8C5D3B] transition">Sách</Link>
        <span>›</span>
        <span className="text-[#1C1917] font-semibold truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Product Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Book Cover Image */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white border border-[#E7E0D5] shadow-xl p-4 flex items-center justify-center">
            <img
              src={imgSrc}
              alt={book.title}
              onError={() => setImgSrc(FALLBACK_COVER)}
              className="w-full h-full object-cover rounded-2xl shadow-md transition-transform duration-500 hover:scale-103"
            />

            {/* Badges */}
            <div className="absolute top-7 left-7 z-10 flex flex-col gap-2">
              {book.isFeatured && (
                <Badge variant="forest" size="md">
                  Tác phẩm nổi bật
                </Badge>
              )}
              {discountPercent > 0 && (
                <Badge variant="gold" size="md">
                  Tiết kiệm {discountPercent}%
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Assurance Badges */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F4EFEB] border border-[#E5DFD4] text-center text-xs">
            <div className="space-y-1">
              <ShieldCheck className="w-4 h-4 text-[#8C5D3B] mx-auto" />
              <p className="font-bold text-stone-800 text-[11px]">100% Chính Ngạch</p>
              <p className="text-[10px] text-stone-500">Bản quyền xuất bản</p>
            </div>
            <div className="space-y-1 border-x border-[#E0D9CD]">
              <Truck className="w-4 h-4 text-[#8C5D3B] mx-auto" />
              <p className="font-bold text-stone-800 text-[11px]">Bọc Sách Cẩn Thận</p>
              <p className="text-[10px] text-stone-500">Chống móp góc 100%</p>
            </div>
            <div className="space-y-1">
              <RotateCcw className="w-4 h-4 text-[#8C5D3B] mx-auto" />
              <p className="font-bold text-stone-800 text-[11px]">Đổi Trả 7 Ngày</p>
              <p className="text-[10px] text-stone-500">Nếu lỗi in ấn</p>
            </div>
          </div>
        </div>

        {/* Right Column: Book Metadata & Purchase Area */}
        <div className="lg:col-span-7 space-y-6">
          {/* Category & Status */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#B88E52]">
              {categoryName}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-600'}`} />
              <span className={`text-xs font-bold ${isOutOfStock ? 'text-rose-700' : 'text-emerald-800'}`}>
                {isOutOfStock ? 'Tạm hết hàng' : `Còn ${book.stockQuantity} cuốn trong kho`}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif-title text-2xl sm:text-4xl font-bold text-[#1C1917] leading-snug">
            {book.title}
          </h1>

          {/* Author & Publisher */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-600 pb-2 border-b border-stone-200">
            <p>
              Tác giả: <strong className="text-[#8C5D3B] font-semibold">{authorsString}</strong>
            </p>
            {book.publisher && (
              <>
                <span>•</span>
                <p>Nhà xuất bản: <span className="font-medium">{book.publisher}</span></p>
              </>
            )}
            {book.publicationYear && (
              <>
                <span>•</span>
                <p>Năm phát hành: <span className="font-medium">{book.publicationYear}</span></p>
              </>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(Number(book.averageRating || 5))
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-stone-800">
              {Number(book.averageRating || 5.0).toFixed(1)}
            </span>
            <span className="text-xs text-stone-400">
              ({book.reviewCount || 0} lượt đánh giá độc giả)
            </span>
          </div>

          {/* Price Box */}
          <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-3">
            <div className="flex items-baseline gap-4">
              <span className="font-serif-title text-3xl sm:text-4xl font-bold text-[#8C5D3B] font-mono">
                {formatCurrencyVND(book.salePrice)}
              </span>
              {book.originalPrice && book.originalPrice > book.salePrice && (
                <span className="text-base text-stone-400 line-through font-mono">
                  {formatCurrencyVND(book.originalPrice)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 italic">
              * Giá đã bao gồm thuế VAT và gói bọc sách màng co bảo vệ tiêu chuẩn NOVELIA.
            </p>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-stone-700">Số lượng:</span>
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold text-stone-900 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= book.stockQuantity || isOutOfStock}
                  onClick={() => setQuantity(Math.min(book.stockQuantity, quantity + 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                disabled={isOutOfStock}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
                onClick={handleAddToCart}
                className="flex-1 min-w-[180px]"
              >
                {isOutOfStock ? 'Tạm Hết Hàng' : 'Thêm Vào Giỏ Hàng'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                leftIcon={<BookOpen className="w-5 h-5 text-[#B88E52]" />}
                onClick={() => setIsSampleOpen(true)}
                className="hover:border-[#B88E52] hover:text-[#B88E52] shrink-0"
              >
                Đọc Thử
              </Button>

              <button
                type="button"
                onClick={() => {
                  if (book) {
                    const added = toggleWishlist(book);
                    setToastMessage(added ? 'Đã thêm vào danh sách yêu thích!' : 'Đã xóa khỏi danh sách yêu thích');
                    setTimeout(() => setToastMessage(null), 2500);
                  }
                }}
                aria-label="Thêm vào danh sách yêu thích"
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                  isWishlisted
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Book Specifications Grid */}
          <div className="space-y-3 pt-6 border-t border-stone-200">
            <h3 className="font-serif-title text-base font-bold text-stone-900">
              Thông Tin Ấn Phẩm
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-white rounded-2xl p-5 border border-stone-200">
              <div>
                <p className="text-stone-400">Mã ISBN</p>
                <p className="font-semibold text-stone-800 font-mono mt-0.5">{book.isbn}</p>
              </div>
              <div>
                <p className="text-stone-400">Hình thức bìa</p>
                <p className="font-semibold text-stone-800 mt-0.5">
                  {book.coverType === 'HARDCOVER' ? 'Bìa Cứng Cao Cấp' : 'Bìa Mềm Tay Gấp'}
                </p>
              </div>
              <div>
                <p className="text-stone-400">Số trang</p>
                <p className="font-semibold text-stone-800 mt-0.5">{book.pages ? `${book.pages} trang` : 'Đang cập nhật'}</p>
              </div>
              <div>
                <p className="text-stone-400">Kích thước</p>
                <p className="font-semibold text-stone-800 mt-0.5">{book.dimensions || '14 x 20.5 cm'}</p>
              </div>
              <div>
                <p className="text-stone-400">Tình trạng kho</p>
                <p className={`font-semibold mt-0.5 ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isOutOfStock ? 'Hết hàng' : `Còn ${book.stockQuantity} bản`}
                </p>
              </div>
              <div>
                <p className="text-stone-400">Đơn vị phát hành</p>
                <p className="font-semibold text-stone-800 mt-0.5">{book.publisher || 'NOVELIA Selection'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Description & Editorial Overview */}
      <div className="space-y-6 pt-8 border-t border-stone-200">
        <h2 className="font-serif-title text-2xl font-bold text-stone-900">
          Giới Thiệu Nội Dung Tác Phẩm
        </h2>

        {book.shortDescription && (
          <p className="text-sm sm:text-base font-serif-title italic text-[#8C5D3B] leading-relaxed p-6 rounded-2xl bg-[#FAF0E6] border border-[#E7D6C5]">
            “{book.shortDescription}”
          </p>
        )}

        <div className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed space-y-4">
          <p className="whitespace-pre-line">
            {book.description || 'Nội dung chi tiết của tác phẩm đang được ban biên tập NOVELIA BOOKS hoàn thiện.'}
          </p>
        </div>
      </div>

      {/* Author Biography Section */}
      {book.authors && book.authors.length > 0 && book.authors[0].biography && (
        <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-4">
          <div className="flex items-center gap-4">
            {book.authors[0].avatarUrl ? (
              <img
                src={book.authors[0].avatarUrl}
                alt={book.authors[0].name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#2A1D13] text-[#E6C687] flex items-center justify-center font-serif-title text-lg font-bold border border-[#D4AF7A]/30">
                {book.authors[0].name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#B88E52]">Tác Giả</p>
              <h3 className="font-serif-title text-lg font-bold text-stone-900">{book.authors[0].name}</h3>
              {book.authors[0].nationality && (
                <p className="text-xs text-stone-500">Quốc tịch: {book.authors[0].nationality}</p>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {book.authors[0].biography}
          </p>
        </div>
      )}

      {/* Book Reviews & Ratings Section */}
      <div className="space-y-8 pt-10 border-t border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-title text-2xl font-bold text-stone-900">
              Đánh Giá & Cảm Nhận Từ Độc Giả
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Những chia sẻ chân thực từ cộng đồng người yêu sách NOVELIA BOOKS
            </p>
          </div>
        </div>

        {/* Rating Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#EAE3D8]">
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#EAE3D8] pb-6 md:pb-0 md:pr-6 text-center">
            <span className="font-serif-title text-5xl font-bold text-[#8C5D3B]">
              {reviewSummary?.averageRating?.toFixed(1) || (book.averageRating ? book.averageRating.toFixed(1) : '5.0')}
            </span>
            <div className="flex items-center gap-1 my-2 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(reviewSummary?.averageRating || book.averageRating || 5)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-stone-500">
              Dựa trên {reviewSummary?.totalReviews ?? (book.reviewCount || 0)} lượt đánh giá đã kiểm duyệt
            </p>
          </div>

          <div className="md:col-span-8 flex flex-col justify-center space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviewSummary?.starCounts ? reviewSummary.starCounts[star] || 0 : (star === 5 ? 1 : 0);
              const total = reviewSummary?.totalReviews || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-stone-600 font-semibold flex items-center gap-1">
                    {star} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  </span>
                  <div className="flex-1 bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#C5A059] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-stone-400 font-mono text-[11px]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Submission Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <h3 className="font-serif-title text-base sm:text-lg font-bold text-stone-900">
            Gửi Cảm Nhận Của Bạn Về Tác Phẩm
          </h3>

          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Đánh giá số sao *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewRating(s)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${s <= newRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-600 ml-2">
                    {newRating === 5 && 'Tuyệt tác kinh điển (5/5)'}
                    {newRating === 4 && 'Rất hay & ý nghĩa (4/5)'}
                    {newRating === 3 && 'Bình thường (3/5)'}
                    {newRating === 2 && 'Chưa ấn tượng (2/5)'}
                    {newRating === 1 && 'Kém hài lòng (1/5)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Nhận xét chi tiết * (Tối thiểu 10 ký tự)
                </label>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm đọc sách, đánh giá chất lượng in ấn, dịch thuật hoặc đóng gói của NOVELIA..."
                  className="w-full text-xs rounded-xl border border-[#D5CDC0] p-3.5 focus:outline-none focus:border-[#8C5D3B] focus:ring-1 focus:ring-[#8C5D3B] bg-[#FAFAF8]"
                  required
                />
              </div>

              {reviewSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reviewSuccessMsg}</span>
                </div>
              )}

              {reviewErrorMsg && (
                <p className="text-xs text-red-600 font-medium">{reviewErrorMsg}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmittingReview}
              >
                Gửi Đánh Giá Để Kiểm Duyệt
              </Button>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs text-stone-600 flex items-center justify-between">
              <span>Vui lòng đăng nhập tài khoản để viết đánh giá cho tác phẩm này.</span>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#8C5D3B] text-white font-bold hover:bg-[#754C2F] transition-all"
              >
                Đăng Nhập
              </Link>
            </div>
          )}
        </div>

        {/* Approved Reviews List */}
        <div className="space-y-4">
          <h3 className="font-serif-title text-base sm:text-lg font-bold text-stone-900">
            Nhận Xét Từ Cộng Đồng Độc Giả ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE3D8] text-stone-400 text-xs">
              Chưa có đánh giá nào cho tác phẩm này. Hãy là độc giả đầu tiên chia sẻ cảm nhận!
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#8C5D3B]/10 text-[#8C5D3B] font-bold flex items-center justify-center text-xs">
                        {(rev.userFullName || 'Độc giả').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#1C1917]">{rev.userFullName || 'Độc giả NOVELIA'}</span>
                        <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-stone-400">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed pt-1">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BookMatch Related Books */}
      {relatedBooks.length > 0 && (
        <div className="pt-8 border-t border-[#EAE3D8] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B88E52]">
                BOOKMATCH™ SUGGESTIONS
              </span>
              <h3 className="font-serif-title text-xl font-bold text-stone-900 mt-1">
                Tác Phẩm Tương Tự Có Thể Bạn Sẽ Thích
              </h3>
            </div>
            <Link
              to="/books"
              className="text-xs font-semibold text-[#8C5D3B] hover:text-[#754C2F] transition-colors"
            >
              Xem tất cả &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedBooks.map((relBook) => (
              <BookCard
                key={relBook.id}
                book={relBook}
                onAddToCart={() => addToCart(relBook.id, 1)}
                onQuickView={() => navigate(`/books/${relBook.slug}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Book Excerpt / Sample Reader Modal */}
      {book && (
        <BookSampleModal
          book={book}
          isOpen={isSampleOpen}
          onClose={() => setIsSampleOpen(false)}
        />
      )}
    </div>
  );
};
