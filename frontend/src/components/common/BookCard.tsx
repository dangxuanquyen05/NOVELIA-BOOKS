import React, { useState } from 'react';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '../../types/book';
import { formatCurrencyVND } from '../../utils/format';
import { useWishlist } from '../../contexts/WishlistContext';

export interface BookCardProps {
  book: Book & { badge?: string };
  onAddToCart?: (book: Book) => void | Promise<any>;
  onQuickView?: (book: Book) => void | Promise<any>;
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onAddToCart,
  onQuickView: _onQuickView,
  className = '',
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(book.id);
  const [isImgError, setIsImgError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(book);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book);
  };

  // Determine badge: either custom badge prop, or calculated discount / bestseller
  let badgeText = book.badge;
  let badgeType: 'gold' | 'red' = 'gold';

  if (!badgeText) {
    if (book.originalPrice && book.originalPrice > book.salePrice) {
      const pct = Math.round(((book.originalPrice - book.salePrice) / book.originalPrice) * 100);
      badgeText = `-${pct}%`;
      badgeType = 'red';
    } else if (book.isFeatured || (book.averageRating && book.averageRating >= 4.7)) {
      badgeText = 'Bán chạy';
      badgeType = 'gold';
    }
  } else if (badgeText.startsWith('-')) {
    badgeType = 'red';
  }

  // Cover image handling with beautiful fallback covers
  const coverUrl = isImgError
    ? 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
    : book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

  return (
    <article
      className={`group relative flex flex-col bg-white rounded-2xl p-3 sm:p-3.5 border border-[#EAE3D8] hover:border-[#8C5D3B]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-2xs ${className}`}
    >
      {/* Top Cover Image */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEB] flex items-center justify-center shadow-inner">
        <Link to={`/books/${book.slug}`} className="w-full h-full block">
          <img
            src={coverUrl}
            alt={book.title}
            onError={() => setIsImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badge in top-left */}
        {badgeText && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-xs ${
                badgeType === 'red'
                  ? 'bg-[#E05344] text-white'
                  : 'bg-[#E5A93C] text-white'
              }`}
            >
              {badgeText}
            </span>
          </div>
        )}

        {/* Wishlist toggle button in top-right */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label="Yêu thích"
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center text-stone-600 hover:text-rose-600 transition shadow-xs cursor-pointer"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'text-rose-600 fill-rose-600' : ''}`} />
        </button>
      </div>

      {/* Book details */}
      <div className="flex flex-col flex-1 pt-3 space-y-1">
        <h3 className="text-xs sm:text-sm font-bold text-[#1C1917] leading-snug line-clamp-1 group-hover:text-[#8C5D3B] transition-colors">
          <Link to={`/books/${book.slug}`}>
            {book.title}
          </Link>
        </h3>

        {/* Rating stars & review count */}
        <div className="flex items-center gap-1 text-[11px] text-stone-500">
          <Star className="w-3 h-3 text-[#E5A93C] fill-[#E5A93C]" />
          <span className="font-semibold text-stone-800">
            {Number(book.averageRating || 4.8).toFixed(1)}
          </span>
          <span className="text-stone-400">
            ({Number(book.reviewCount || 1200).toLocaleString('vi-VN')})
          </span>
        </div>

        {/* Price & Cart button row */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-[#F2ECE4]">
          <span className="text-xs sm:text-sm font-bold text-[#1C1917]">
            {formatCurrencyVND(book.salePrice)}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label="Thêm vào giỏ"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-stone-600 hover:text-[#1C1917] hover:bg-[#FAF7F2] border border-[#EAE3D8] hover:border-[#8C5D3B] transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
