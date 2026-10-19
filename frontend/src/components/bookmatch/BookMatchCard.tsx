import React, { useState } from 'react';
import {
  ShoppingBag,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { BookMatchItem } from '../../types/bookMatch';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../ui/Button';
import { useCart } from '../../contexts/CartContext';

export interface BookMatchCardProps {
  item: BookMatchItem;
  onAddedToCart?: (title: string) => void;
  onFeedback?: (bookId: number, type: 'HELPFUL' | 'NOT_RELEVANT') => void;
  className?: string;
}

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const BookMatchCard: React.FC<BookMatchCardProps> = ({
  item,
  onAddedToCart,
  onFeedback,
  className = '',
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.coverImage || FALLBACK_COVER);
  const [showAllReasons, setShowAllReasons] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'HELPFUL' | 'NOT_RELEVANT' | null>(null);

  const isOutOfStock = item.availableQuantity <= 0;
  const authorNames = item.authors && item.authors.length > 0
    ? item.authors.join(', ')
    : 'Tác giả NOVELIA';
  const categoryNames = item.categories && item.categories.length > 0
    ? item.categories.join(', ')
    : 'Tuyển Chọn';

  // Format match score display (e.g. 88.5% -> 89%)
  const scorePercent = Math.round(item.matchScore);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    try {
      const res = await addToCart(item.bookId, 1);
      if (res.success && onAddedToCart) {
        onAddedToCart(item.title);
      }
    } catch (err) {
      console.error('Lỗi thêm giỏ hàng:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleFeedbackClick = (type: 'HELPFUL' | 'NOT_RELEVANT') => {
    setFeedbackState(type);
    if (onFeedback) {
      onFeedback(item.bookId, type);
    }
  };

  const handleUndoDismiss = () => {
    setFeedbackState(null);
  };

  // If user marked as not relevant, show an unobtrusive dismissal banner with undo option
  if (feedbackState === 'NOT_RELEVANT') {
    return (
      <article
        className={`group relative flex flex-col justify-center items-center bg-[#FAF8F5] rounded-3xl p-6 border border-dashed border-[#D8D0C5] text-center transition-all duration-300 min-h-[320px] ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-500 mb-3">
          <ThumbsDown className="w-5 h-5" />
        </div>
        <h4 className="font-medium text-sm text-stone-700">Đã ẩn sách khỏi danh sách gợi ý</h4>
        <p className="text-xs text-stone-500 mt-1 max-w-xs">
          "{item.title}" sẽ không xuất hiện lại trong kết quả của bạn.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 text-xs rounded-xl border-[#D8D0C5] text-[#8C5D3B] hover:bg-white"
          onClick={handleUndoDismiss}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Hoàn tác
        </Button>
      </article>
    );
  }

  const displayedReasons = showAllReasons
    ? item.matchReasons
    : item.matchReasons.slice(0, 3);

  // Score badge style based on match level
  const isHighMatch = scorePercent >= 85;

  return (
    <article
      className={`group relative flex flex-col bg-white rounded-3xl p-4 sm:p-6 border transition-all duration-300 hover:-translate-y-1.5 book-shadow hover:book-shadow-hover overflow-hidden ${
        isHighMatch
          ? 'border-[#B88E52]/40 hover:border-[#B88E52]'
          : 'border-[#E8E2D8] hover:border-[#8C5D3B]/50'
      } ${className}`}
    >
      {/* Subtle Luxury Gold Shimmer Top Bar for High Matches */}
      {isHighMatch && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#B88E52] via-[#E6C687] to-[#B88E52] animate-pulse-subtle pointer-events-none" />
      )}

      {/* Top Match Score Banner & Quick Feedback Controls */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EBE1]">
        {/* Radiant Score Badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm ${
            isHighMatch
              ? 'bg-gradient-to-r from-[#B88E52] via-[#C9A265] to-[#8C6630] text-white gold-glow'
              : 'bg-gradient-to-r from-[#8C5D3B] to-[#2D5A43] text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FFE7B3] animate-spin-slow" />
          <span className="tracking-wide">{scorePercent}% Phù Hợp</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Helpful & Not Relevant Buttons */}
          <div className="flex items-center bg-[#F4EFEB] rounded-full p-1 border border-[#E5DEC9] shadow-inner">
            <button
              type="button"
              title="Gợi ý này rất hữu ích!"
              aria-label="Gợi ý hữu ích"
              onClick={() => handleFeedbackClick('HELPFUL')}
              className={`p-1.5 rounded-full transition-all duration-200 active:scale-90 ${
                feedbackState === 'HELPFUL'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-stone-500 hover:text-emerald-700 hover:bg-white/80'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Không phù hợp (Ẩn khỏi gợi ý của tôi)"
              aria-label="Không phù hợp"
              onClick={() => handleFeedbackClick('NOT_RELEVANT')}
              className="p-1.5 rounded-full text-stone-500 hover:text-rose-700 hover:bg-white/80 transition-all duration-200 active:scale-90"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                Tạm hết
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Còn {item.availableQuantity}
              </span>
            )}
          </div>
        </div>
      </div>

      {feedbackState === 'HELPFUL' && (
        <div className="mb-3.5 px-3.5 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Ghi nhận phản hồi! Hệ thống sẽ ưu tiên các tác phẩm cùng thể loại cho bạn.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 flex-1">
        {/* Cover Image with Book Spine 3D Effect */}
        <div className="sm:col-span-5 relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F4EFEB] shadow-md shrink-0">
          {/* Book Spine Shadow Overlay */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent z-10 pointer-events-none" />

          <img
            src={imgSrc}
            alt={item.title}
            loading="lazy"
            onError={() => setImgSrc(FALLBACK_COVER)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
          />

          {/* Bottom Vignette */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {item.readingLevel && (
            <div className="absolute bottom-2.5 inset-x-2.5 z-10">
              <span className="block text-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/20">
                {item.readingLevel === 'BEGINNER' ? 'Dễ tiếp cận' : item.readingLevel === 'ADVANCED' ? 'Chuyên sâu' : 'Tiêu chuẩn'}
              </span>
            </div>
          )}
        </div>

        {/* Content & Match Reasons */}
        <div className="sm:col-span-7 flex flex-col justify-between space-y-3.5">
          <div>
            <span className="text-[11px] font-bold text-[#8C6D3B] uppercase tracking-wider line-clamp-1">
              {categoryNames}
            </span>
            <h3 className="font-serif-title font-bold text-base sm:text-lg text-[#1C1917] line-clamp-2 mt-0.5 group-hover:text-[#8C5D3B] transition-colors leading-snug">
              <Link to={`/books/${item.slug}`}>{item.title}</Link>
            </h3>
            <p className="text-xs text-stone-500 mt-1 line-clamp-1 italic font-light">
              bởi {authorNames}
            </p>

            {/* Price display with prominent styling */}
            <div className="flex items-baseline gap-2.5 mt-2.5">
              <span className="font-bold text-lg text-[#8C5D3B]">
                {formatCurrencyVND(item.salePrice)}
              </span>
              {item.originalPrice > item.salePrice && (
                <span className="text-xs text-stone-400 line-through">
                  {formatCurrencyVND(item.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Verifiable Match Reasons - Library Certificate Card */}
          <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#EAE3D8] text-xs space-y-2">
            <span className="font-bold text-[#8C5D3B] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-[#B88E52]" /> Căn cứ gợi ý phù hợp:
            </span>
            <ul className="space-y-1.5">
              {displayedReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-stone-700 text-[11px] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88E52] mt-1.5 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            {item.matchReasons.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllReasons(!showAllReasons)}
                className="text-[11px] text-[#8C6D3B] hover:text-[#8C5D3B] font-bold underline mt-1.5 block cursor-pointer transition-colors"
              >
                {showAllReasons ? '▲ Thu gọn danh sách lý do' : `▼ Xem thêm ${item.matchReasons.length - 3} lý do khác`}
              </button>
            )}
            {item.missingAttributes && item.missingAttributes.length > 0 && (
              <div className="pt-2 border-t border-[#EAE3D8] text-[10px] text-stone-500 italic flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{item.missingAttributes[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3.5 border-t border-[#F0EBE1] flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs py-2.5 rounded-xl border-[#D8D0C5] hover:bg-[#F4EFEB] hover:text-[#8C5D3B] font-semibold transition-all duration-200"
          onClick={() => navigate(`/books/${item.slug}`)}
        >
          <Eye className="w-3.5 h-3.5 mr-1 text-[#8C6D3B]" /> Chi tiết
        </Button>

        <Button
          variant="primary"
          size="sm"
          disabled={isOutOfStock || isAdding}
          className="flex-1 text-xs py-2.5 rounded-xl bg-[#8C5D3B] hover:bg-[#754C2F] text-white disabled:opacity-50 font-bold transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="w-3.5 h-3.5 mr-1 text-[#E6C687]" />
          {isAdding ? 'Đang thêm...' : isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
        </Button>
      </div>
    </article>
  );
};
