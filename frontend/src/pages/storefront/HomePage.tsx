import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  TrendingUp,
  Sprout,
  Heart,
  Baby,
  Atom,
  Laptop,
  Activity,
  Languages,
  MoreHorizontal,
  Compass,
  Check,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCard } from '../../components/common/BookCard';
import { bookService } from '../../services/bookService';
import type { Book } from '../../types/book';
import { useCart } from '../../contexts/CartContext';
import { NOVELIA_CATEGORIES, NOVELIA_BESTSELLERS } from '../../data/noveliaBooksData';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [bestsellers, setBestsellers] = useState<Book[]>(NOVELIA_BESTSELLERS);
  const [activeHeroDot, setActiveHeroDot] = useState(0);

  const [cartToast, setCartToast] = useState<{ show: boolean; bookTitle: string }>({
    show: false,
    bookTitle: '',
  });

  useEffect(() => {
    // Attempt to load live bestsellers from backend if available
    bookService
      .getBooks({ sortBy: 'rating', size: 6 })
      .then((res) => {
        if (res.success && res.data.content && res.data.content.length > 0) {
          // If backend has items, combine or map them
          const liveBooks = res.data.content;
          if (liveBooks.length >= 4) {
            setBestsellers(liveBooks);
          }
        }
      })
      .catch(() => {
        // Fallback already preset to NOVELIA_BESTSELLERS from image
      });
  }, []);

  const handleAddToCart = async (book: Book) => {
    const res = await addToCart(book.id, 1);
    if (res.success) {
      setCartToast({ show: true, bookTitle: book.title });
    } else {
      setCartToast({ show: true, bookTitle: res.message || 'Đã thêm vào giỏ hàng' });
    }
    setTimeout(() => {
      setCartToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Helper to render category icon
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5" />;
      case 'Heart':
        return <Heart className="w-5 h-5" />;
      case 'Baby':
        return <Baby className="w-5 h-5" />;
      case 'Atom':
        return <Atom className="w-5 h-5" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5" />;
      case 'Activity':
        return <Activity className="w-5 h-5" />;
      case 'Languages':
        return <Languages className="w-5 h-5" />;
      default:
        return <MoreHorizontal className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-10 sm:space-y-12 py-5 sm:py-8">
      {/* Toast Notification */}
      {cartToast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#1C1917] text-white shadow-2xl border border-white/10 animate-fade-in max-w-sm">
          <div className="w-7 h-7 rounded-full bg-[#8C5D3B] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold">Đã thêm vào giỏ hàng:</p>
            <p className="text-stone-300 line-clamp-1">{cartToast.bookTitle}</p>
          </div>
          <button
            onClick={() => setCartToast({ show: false, bookTitle: '' })}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HERO BANNER: Matches the top-left design exactly */}
      <section className="relative overflow-hidden rounded-3xl bg-[#ECE4D8] border border-[#DDD3C4] shadow-sm min-h-[360px] sm:min-h-[420px] lg:min-h-[460px] flex items-center">
        {/* Photographic Tabletop Background with books, mug, and warm natural ambiance */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1800')`,
          }}
        />

        {/* Soft gradient overlay for legibility on left side and bottom */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/85 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5]/60 via-transparent to-transparent pointer-events-none" />

        {/* Main Content inside Hero */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Block */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] leading-[1.18] tracking-tight">
                Sách hay<br />
                cho những hành trình<br />
                tuyệt vời
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-normal max-w-md pt-2 leading-relaxed">
                Khám phá hàng ngàn cuốn sách chất lượng với giá tốt nhất tại NOVELIA BOOKS.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#1C1917] hover:bg-[#2F2720] text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer"
              >
                <span>Khám phá ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pagination dots at bottom left */}
            <div className="flex items-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setActiveHeroDot(0)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeHeroDot === 0 ? 'w-7 bg-[#1C1917]' : 'w-2 bg-stone-400 hover:bg-stone-600'
                }`}
                aria-label="Slide 1"
              />
              <button
                type="button"
                onClick={() => setActiveHeroDot(1)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeHeroDot === 1 ? 'w-7 bg-[#1C1917]' : 'w-2 bg-stone-400 hover:bg-stone-600'
                }`}
                aria-label="Slide 2"
              />
              <button
                type="button"
                onClick={() => setActiveHeroDot(2)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeHeroDot === 2 ? 'w-7 bg-[#1C1917]' : 'w-2 bg-stone-400 hover:bg-stone-600'
                }`}
                aria-label="Slide 3"
              />
            </div>
          </div>

          {/* Right Script Typography Overlay */}
          <div className="hidden lg:flex lg:col-span-5 justify-end items-center pr-6">
            <div className="text-right space-y-1 transform rotate-[-3deg] select-none">
              <p className="font-serif italic text-3xl xl:text-4xl text-stone-800 drop-shadow-xs font-light">
                Better Books
              </p>
              <p className="font-serif italic text-3xl xl:text-4xl text-stone-800 drop-shadow-xs font-light flex items-center justify-end gap-2">
                <span>Better You</span>
                <span className="text-rose-600 text-2xl not-italic">♡</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY ICONS ROW (10 Items): Exact match from design */}
      <section className="space-y-4">
        {/* Desktop Grid & Mobile Horizontal Scroll */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 overflow-x-auto pb-2 scrollbar-none">
          {NOVELIA_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/books?category=${cat.slug}`}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EAE3D8] hover:border-[#8C5D3B] transition-all duration-200 hover:-translate-y-1 hover:shadow-sm text-center min-w-[90px]"
            >
              <div
                className={`w-11 h-11 rounded-full ${cat.bgLight} ${cat.iconColor} flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110`}
              >
                {renderCategoryIcon(cat.iconName)}
              </div>
              <span className="text-xs font-semibold text-[#1C1917] group-hover:text-[#8C5D3B] transition-colors line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. SÁCH BÁN CHẠY NHẤT: Exact 6 cards with header and "Xem tất cả ->" */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#1C1917]">
            Sách bán chạy nhất
          </h2>
          <Link
            to="/books?sortBy=rating"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#8C5D3B] transition group"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 6 Books Grid (6 columns on desktop, 3 on tablet, 2 on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {bestsellers.slice(0, 6).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

      {/* 4. THREE PROMOTION BANNERS: Exact visual match to bottom of Home in screenshot */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
        {/* Banner 1: NOVELIA BookMatch (Dark Theme) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1C1917] text-white p-6 sm:p-7 flex flex-col justify-between min-h-[190px] shadow-sm group">
          {/* Subtle background compass / watch visual */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full border border-white/10 opacity-40 group-hover:scale-110 transition-transform pointer-events-none flex items-center justify-center">
            <Compass className="w-16 h-16 text-[#E6C687]/40" />
          </div>

          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-[#E6C687]" />
              </div>
              <h3 className="font-bold text-sm tracking-wide text-white">
                NOVELIA BookMatch
              </h3>
            </div>
            <p className="text-xs text-stone-300 font-light leading-relaxed max-w-[210px] pt-1">
              Tìm sách phù hợp với bạn chỉ trong vài phút
            </p>
          </div>

          <div className="pt-4 relative z-10">
            <button
              type="button"
              onClick={() => navigate('/bookmatch')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-[#1C1917] text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Bắt đầu ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Banner 2: Ưu đãi mùa hè (Warm Cream with books stack visual) */}
        <div className="relative overflow-hidden rounded-2xl bg-[#F4EFEB] border border-[#E7DFD3] text-[#1C1917] p-6 sm:p-7 flex flex-col justify-between min-h-[190px] shadow-sm group">
          {/* Decorative books visual on right */}
          <div
            className="absolute -right-2 -bottom-2 w-32 h-32 bg-contain bg-bottom bg-no-repeat opacity-85 group-hover:scale-105 transition-transform pointer-events-none"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300')`,
            }}
          />

          <div className="space-y-1.5 relative z-10">
            <h3 className="font-bold text-sm tracking-wide text-[#1C1917]">
              Ưu đãi mùa hè
            </h3>
            <p className="text-xs text-stone-600 font-light leading-relaxed max-w-[200px] pt-1">
              Giảm đến 50% cho hàng nghìn đầu sách
            </p>
          </div>

          <div className="pt-4 relative z-10">
            <button
              type="button"
              onClick={() => navigate('/books?filter=promo')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8C5D3B] hover:bg-[#72482B] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Mua ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Banner 3: Đọc sách là đầu tư cho bản thân (Warm Reader Photo) */}
        <div className="relative overflow-hidden rounded-2xl bg-stone-900 text-white p-6 sm:p-7 flex flex-col justify-between min-h-[190px] shadow-sm group">
          {/* Reader photo background with warm sunlight */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          <div className="space-y-1.5 relative z-10">
            <h3 className="font-bold text-sm tracking-wide text-white leading-snug max-w-[210px]">
              Đọc sách<br />là đầu tư cho<br />bản thân
            </h3>
          </div>

          <div className="pt-4 relative z-10">
            <button
              type="button"
              onClick={() => navigate('/books')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#1C1917] text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Khám phá</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
