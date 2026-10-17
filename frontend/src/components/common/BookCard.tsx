import React, { useState } from 'react';
import { Star, ShoppingBag, Heart, Eye, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '../../types/book';
import { formatCurrencyVND } from '../../utils/format';
import { Badge } from '../ui/Badge';

import { useWishlist } from '../../contexts/WishlistContext';

export interface BookCardProps {
  book: Book;
  onAddToCart?: (book: Book) => void;
  onQuickView?: (book: Book) => void;
  className?: string;
}

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onAddToCart,
  onQuickView,
  className = '',
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(book.id);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(book.coverImage || FALLBACK_COVER);
  const [hasImageError, setHasImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onAddToCart) onAddToCart(book);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(book);
  };

  const authorNames = book.authors && book.authors.length > 0
    ? book.authors.map((a) => a.name).join(', ')
    : 'Tác giả NOVELIA';

  const categoryName = book.categories && book.categories.length > 0
    ? book.categories[0].name
    : 'Tuyển Chọn';

  const isOutOfStock = book.stockQuantity <= 0;
  const discountPercent = book.originalPrice && book.originalPrice > book.salePrice
    ? Math.round(((book.originalPrice - book.salePrice) / book.originalPrice) * 100)
    : 0;

  return (
    <article
      className={`group relative flex flex-col bg-white rounded-2xl p-3 sm:p-3.5 border border-[#EBE5DC] hover:border-[#1B3B2B]/40 transition-all duration-300 hover:-translate-y-1 book-shadow hover:book-shadow-hover ${className}`}
    >
      {/* Cover Image Container */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEB] flex items-center justify-center">
        {/* Skeleton while loading */}
        {!isImageLoaded && !hasImageError && (
          <div className="absolute inset-0 animate-pulse bg-[#E8E2D8]" />
        )}

        <img
          src={imgSrc}
          alt={book.title}
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => {
            setHasImageError(true);
            setImgSrc(FALLBACK_COVER);
            setIsImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
          {book.isFeatured && (
            <Badge variant="forest" size="sm">
              Nổi bật
            </Badge>
          )}
          {discountPercent > 0 && (
            <Badge variant="gold" size="sm">
              -{discountPercent}%
            </Badge>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Tạm hết hàng
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label="Thêm vào danh sách yêu thích"
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-700 hover:text-rose-600 hover:bg-white shadow-xs transition cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition ${
              isWishlisted ? 'text-rose-600 fill-rose-600' : ''
            }`}
          />
        </button>

        {/* Quick View Floating Overlay on Desktop */}
        <div className="absolute inset-x-3 bottom-3 z-10 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handleQuickView}
            className="w-full py-2 px-3 rounded-lg bg-white/95 backdrop-blur-xs text-[#1C1917] hover:text-[#1B3B2B] text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem nhanh</span>
          </button>
        </div>
      </div>

      {/* Book Info */}
      <div className="flex flex-col flex-grow pt-3.5 px-1 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="uppercase font-bold tracking-wider text-[#B88E52]">
            {categoryName}
          </span>
          <span className={`font-semibold ${isOutOfStock ? 'text-stone-400' : 'text-emerald-700'}`}>
            {isOutOfStock ? 'Hết hàng' : `Còn ${book.stockQuantity} cuốn`}
          </span>
        </div>

        <h3 className="font-serif-title text-sm sm:text-base font-bold text-[#1C1917] leading-snug line-clamp-2 group-hover:text-[#1B3B2B] transition-colors">
          <Link to={`/books/${book.slug}`}>
            {book.title}
          </Link>
        </h3>

        <p className="text-xs text-[#6E6862] line-clamp-1 font-medium">
          {authorNames}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 pt-0.5">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
          </div>
          <span className="text-xs font-bold text-stone-800">
            {Number(book.averageRating || 5.0).toFixed(1)}
          </span>
          <span className="text-[11px] text-stone-400">({book.reviewCount || 0})</span>
        </div>

        {/* Pricing & Add To Cart Button */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-[#F2ECE4]">
          <div className="space-y-0.5">
            <div className="text-sm sm:text-base font-bold text-[#1B3B2B] font-mono">
              {formatCurrencyVND(book.salePrice)}
            </div>
            {book.originalPrice && book.originalPrice > book.salePrice && (
              <div className="text-[11px] text-stone-400 line-through font-mono">
                {formatCurrencyVND(book.originalPrice)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Tác phẩm tạm thời hết hàng' : 'Thêm vào giỏ hàng'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-xs ${
              isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-[#EDF3EF] hover:bg-[#1B3B2B] text-[#1B3B2B] hover:text-white cursor-pointer active:scale-95'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
