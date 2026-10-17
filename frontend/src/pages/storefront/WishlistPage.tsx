import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, BookOpen, Star } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { formatCurrencyVND } from '../../utils/format';
import { Button } from '../../components/ui/Button';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const handleAddToCart = async (bookId: number) => {
    const res = await addToCart(bookId, 1);
    if (res.success) {
      setToastMessage('Đã thêm tác phẩm vào giỏ hàng thành công!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleAddAllToCart = async () => {
    let count = 0;
    for (const book of wishlist) {
      if (book.stockQuantity > 0) {
        await addToCart(book.id, 1);
        count++;
      }
    }
    setToastMessage(`Đã thêm ${count} tác phẩm còn hàng vào giỏ!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="py-8 sm:py-12 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B3B2B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up border border-[#2D5A43]">
          <ShoppingBag className="w-4 h-4 text-[#B88E52]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-[#B88E52] mb-1">
            <Heart className="w-4 h-4 fill-[#B88E52]" />
            <span>Bộ Sưu Tập Riêng • Wishlist</span>
          </div>
          <h1 className="font-serif-title text-2xl sm:text-4xl font-bold text-[#1C1917]">
            Tác Phẩm Yêu Thích
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 font-serif-body">
            Lưu giữ những áng văn và tư tưởng bạn mong muốn sở hữu trong thư viện cá nhân
          </p>
        </div>

        {wishlistCount > 0 && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={clearWishlist}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-stone-500" />}
            >
              Xóa Tất Cả
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddAllToCart}
              leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            >
              Thêm Tất Cả Vào Giỏ
            </Button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {wishlistCount === 0 ? (
        <div className="py-16 sm:py-24 text-center space-y-5 bg-white/60 rounded-3xl border border-[#EDE7DD] p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FAF5EE] text-[#B88E52] flex items-center justify-center mx-auto border border-[#EADBCA]">
            <Heart className="w-8 h-8 text-[#B88E52]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-stone-900">
              Danh Sách Yêu Thích Đang Trống
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-serif-body max-w-md mx-auto">
              Bạn chưa lưu tác phẩm nào vào danh sách. Hãy dạo quanh các bộ sưu tập kinh điển của NOVELIA BOOKS và nhấn biểu tượng trái tim để lưu lại.
            </p>
          </div>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold bg-[#1B3B2B] text-white hover:bg-[#25523D] transition shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>Khám Phá Sách Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Wishlist Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((book) => {
            const isOutOfStock = book.stockQuantity <= 0;
            const authorNames = book.authors?.map((a) => a.name).join(', ') || 'Tác giả NOVELIA';
            const categoryName = book.categories?.[0]?.name || 'Tuyển Chọn';

            return (
              <div
                key={book.id}
                className="group relative flex flex-col bg-white rounded-2xl p-4 border border-[#E8E2D8] hover:border-[#1B3B2B]/40 transition-all duration-300 hover:-translate-y-1 book-shadow"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFromWishlist(book.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 text-stone-400 hover:text-rose-600 hover:bg-rose-50 shadow-xs transition cursor-pointer"
                  title="Xóa khỏi yêu thích"
                  aria-label="Xóa khỏi yêu thích"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Cover Image */}
                <Link
                  to={`/books/${book.slug}`}
                  className="block relative aspect-[3/4] rounded-xl overflow-hidden bg-[#F4EFEB] mb-3"
                >
                  <img
                    src={book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {isOutOfStock && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-xs">
                      Tạm hết hàng
                    </span>
                  )}
                </Link>

                {/* Book Details */}
                <div className="flex-1 flex flex-col space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#B88E52]">
                    {categoryName}
                  </span>

                  <h3 className="font-serif-title text-sm sm:text-base font-bold text-stone-900 line-clamp-2 group-hover:text-[#1B3B2B] transition">
                    <Link to={`/books/${book.slug}`}>{book.title}</Link>
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-1">{authorNames}</p>

                  <div className="flex items-center gap-1 text-xs text-amber-500 pt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span className="font-bold text-stone-800">
                      {Number(book.averageRating || 5.0).toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                    <div>
                      <div className="text-sm sm:text-base font-bold font-mono text-[#1B3B2B]">
                        {formatCurrencyVND(book.salePrice)}
                      </div>
                      {book.originalPrice && book.originalPrice > book.salePrice && (
                        <div className="text-[11px] font-mono text-stone-400 line-through">
                          {formatCurrencyVND(book.originalPrice)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(book.id)}
                      disabled={isOutOfStock}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        isOutOfStock
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : 'bg-[#1B3B2B] text-white hover:bg-[#25523D] active:scale-95 shadow-xs'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Hết hàng' : 'Thêm giỏ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
