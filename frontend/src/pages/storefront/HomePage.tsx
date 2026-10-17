import React, { useState, useEffect } from 'react';
import { ArrowRight, Compass, Sparkles, Feather, ShieldCheck, HeartHandshake, BookMarked, Check, X, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { SectionHeading } from '../../components/common/SectionHeading';
import { BookCard } from '../../components/common/BookCard';
import { SkeletonBookCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { bookService } from '../../services/bookService';
import type { Book, Category } from '../../types/book';
import { useCart } from '../../contexts/CartContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [bestsellers, setBestsellers] = useState<Book[]>([]);
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spotlightBook, setSpotlightBook] = useState<Book | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [cartToast, setCartToast] = useState<{ show: boolean; bookTitle: string }>({
    show: false,
    bookTitle: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [bestsellersRes, newArrivalsRes, categoriesRes] = await Promise.all([
        bookService.getBooks({ sortBy: 'rating', size: 4 }),
        bookService.getBooks({ sortBy: 'newest', size: 4 }),
        bookService.getCategories(),
      ]);

      if (bestsellersRes.success) {
        setBestsellers(bestsellersRes.data.content);
        // Find featured book for spotlight
        const featured = bestsellersRes.data.content.find((b) => b.isFeatured) || bestsellersRes.data.content[0];
        setSpotlightBook(featured || null);
      }

      if (newArrivalsRes.success) {
        setNewArrivals(newArrivalsRes.data.content);
      }

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu trang chủ từ API:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToCart = async (book: Book) => {
    const res = await addToCart(book.id, 1);
    if (res.success) {
      setCartToast({ show: true, bookTitle: book.title });
    } else {
      setCartToast({ show: true, bookTitle: res.message || 'Lỗi thêm vào giỏ hàng' });
    }
    setTimeout(() => {
      setCartToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-6 sm:py-10">
      {/* Toast Notification khi thêm vào giỏ */}
      {cartToast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#1B3B2B] text-white shadow-xl border border-white/10 animate-fade-in max-w-md">
          <div className="w-8 h-8 rounded-full bg-[#B88E52] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white">Đã thêm vào giỏ hàng:</p>
            <p className="text-[#C9DDD2] line-clamp-1">{cartToast.bookTitle}</p>
          </div>
          <button
            onClick={() => setCartToast({ show: false, bookTitle: '' })}
            className="text-stone-300 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HERO BANNER: Modern Editorial Bookstore */}
      <section className="relative overflow-hidden rounded-3xl bg-[#F4EFEB] border border-[#E7E0D5] p-6 sm:p-12 lg:p-16">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#1B3B2B]/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#B88E52]/10 blur-2xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDF3EF] border border-[#D5E3DA] text-[#1B3B2B] text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#B88E52]" />
              <span>Modern Editorial Bookstore</span>
            </div>

            <h1 className="font-serif-title text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1C1917] leading-[1.12]">
              Nơi những kiệt tác văn chương tìm thấy <span className="italic text-[#1B3B2B]">tri kỷ</span>.
            </h1>

            <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-xl font-normal">
              Chào mừng bạn đến với NOVELIA BOOKS — tuyển tập những tác phẩm văn học bất hủ, triết học khai sáng và những ấn bản nghệ thuật chế tác công phu dành cho những người yêu cái đẹp.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Compass className="w-4 h-4" />}
                onClick={() => navigate('/books')}
              >
                Khám Phá Tủ Sách
              </Button>

              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  const el = document.getElementById('about-us');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Về Chúng Tôi
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E5DFD4] max-w-md">
              <div>
                <p className="font-serif-title text-2xl font-bold text-[#1B3B2B]">5.000+</p>
                <p className="text-[11px] text-[#78716C] font-medium">Tựa sách chọn lọc</p>
              </div>
              <div>
                <p className="font-serif-title text-2xl font-bold text-[#1B3B2B]">100%</p>
                <p className="text-[11px] text-[#78716C] font-medium">Ấn bản chính ngạch</p>
              </div>
              <div>
                <p className="font-serif-title text-2xl font-bold text-[#1B3B2B]">4.9/5</p>
                <p className="text-[11px] text-[#78716C] font-medium">Độc giả hài lòng</p>
              </div>
            </div>
          </div>

          {/* Hero Right: Spotlight Book from Database */}
          <div className="lg:col-span-5 flex justify-center">
            {spotlightBook ? (
              <Link
                to={`/books/${spotlightBook.slug}`}
                className="group relative w-full max-w-sm bg-white rounded-3xl p-5 border border-[#E7E0D5] shadow-xl space-y-4 transition-transform duration-300 hover:-translate-y-1 block"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF7F2]">
                  <img
                    src={spotlightBook.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
                    alt={spotlightBook.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1B3B2B] text-white">
                      Ấn phẩm nổi bật
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88E52]">
                    {spotlightBook.categories?.[0]?.name || 'Kinh Điển'}
                  </span>
                  <h3 className="font-serif-title text-lg font-bold text-[#1C1917] group-hover:text-[#1B3B2B] transition-colors leading-snug line-clamp-1">
                    {spotlightBook.title}
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    {spotlightBook.authors?.map((a) => a.name).join(', ') || 'Tác giả NOVELIA'}
                  </p>

                  {spotlightBook.shortDescription && (
                    <p className="text-xs text-stone-600 italic pt-1 leading-relaxed border-t border-stone-100 line-clamp-2">
                      “{spotlightBook.shortDescription}”
                    </p>
                  )}
                </div>
              </Link>
            ) : (
              <div className="w-full max-w-sm aspect-[3/4] rounded-3xl bg-white border border-[#E7E0D5] p-5 animate-pulse" />
            )}
          </div>
        </div>
      </section>

      {/* ERROR BANNER IF SERVER DOWN */}
      {hasError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
          <span>Không thể kết nối API trực tiếp từ backend. Hãy kiểm tra dịch vụ máy chủ.</span>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3 h-3" />} onClick={loadData}>
            Thử lại
          </Button>
        </div>
      )}

      {/* 2. FEATURED CATEGORIES: Danh mục nổi bật từ backend */}
      <section id="categories" className="space-y-8">
        <SectionHeading
          overline="CHỦ ĐỀ TUYỂN CHỌN"
          title="Danh Mục Sách Trọng Điểm"
          subtitle="Các mảng sách được thủ thư của NOVELIA giám tuyển kỹ lưỡng về chiều sâu tư tưởng và giá trị nghệ thuật."
          linkText="Xem tất cả chủ đề"
          linkTo="/books"
        />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate(`/books?category=${category.slug}`)}
                className="group relative overflow-hidden rounded-2xl bg-white border border-[#EBE5DC] hover:border-[#1B3B2B] transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md cursor-pointer p-5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="w-2 h-2 rounded-full bg-[#B88E52] block" />
                  <h3 className="font-serif-title text-sm sm:text-base font-bold text-[#1C1917] group-hover:text-[#1B3B2B] transition-colors leading-snug">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-[11px] text-[#78716C] line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] font-semibold text-[#1B3B2B]">
                  <span>Khám phá</span>
                  <ArrowRight className="w-3.5 h-3.5 transform transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. BESTSELLERS: Sách bán chạy từ backend */}
      <section id="bestsellers" className="space-y-8">
        <SectionHeading
          overline="ĐƯỢC ĐỘC GIẢ YÊU THÍCH"
          title="Những Tác Phẩm Bán Chạy Nhất"
          subtitle="Những cuốn sách được tái bản liên tục và giữ vị trí đặc biệt trong lòng người yêu sách."
          linkText="Xem tất cả tác phẩm"
          linkTo="/books?sortBy=rating"
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBookCard key={i} />
            ))}
          </div>
        ) : bestsellers.length === 0 ? (
          <EmptyState
            title="Chưa có sách trên kệ"
            description="Dữ liệu sách đang được cập nhật từ hệ thống máy chủ."
            actionText="Tải lại dữ liệu"
            onAction={loadData}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {bestsellers.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={handleAddToCart}
                onQuickView={() => navigate(`/books/${book.slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. NEW ARRIVALS: Sách mới phát hành từ backend */}
      <section id="new-arrivals" className="space-y-8">
        <SectionHeading
          overline="ẤN BẢN MỚI PHÁT HÀNH"
          title="Mới Cập Bến NOVELIA"
          subtitle="Các bản dịch mới nhất, ấn bản kỷ niệm giới hạn vừa được đưa lên kệ sách tuần này."
          linkText="Xem thêm sách mới"
          linkTo="/books?sortBy=newest"
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBookCard key={i} />
            ))}
          </div>
        ) : newArrivals.length === 0 ? (
          <EmptyState
            title="Chưa có ấn bản mới"
            description="Các ấn phẩm mới nhất sẽ sớm được ra mắt độc giả."
            actionText="Tải lại dữ liệu"
            onAction={loadData}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={handleAddToCart}
                onQuickView={() => navigate(`/books/${book.slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. BRAND EDITORIAL STORY */}
      <section
        id="about-us"
        className="relative overflow-hidden rounded-3xl bg-[#12281D] text-white p-8 sm:p-14 lg:p-20 shadow-xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[1.5px] bg-[#B88E52]" />
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#B88E52]">
                TRIẾT LÝ NOVELIA BOOKS
              </span>
            </div>

            <h2 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              “Sách không chỉ lưu giữ con chữ; đó là nơi trú ngụ của những linh hồn vĩ đại.”
            </h2>

            <p className="text-xs sm:text-sm text-[#B4CDC1] leading-relaxed font-light">
              Tại NOVELIA BOOKS, chúng tôi tin rằng việc đọc sách là một nghi thức thưởng thức nghệ thuật thuần khiết. Mỗi tựa sách khi được đưa lên kệ đều phải thỏa mãn ba chuẩn mực khắt khe: giá trị tri thức khai sáng, tính thẩm mỹ của ngôn từ và sự trân trọng đối với chất liệu in ấn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10 text-xs">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#B88E52]">
                  <Feather className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Bản Dịch Chuẩn Xác</h4>
                <p className="text-[#88A393] text-[11px] leading-relaxed">
                  Lựa chọn những bản dịch uy tín từ các dịch giả hàng đầu.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#B88E52]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Bao Bọc Thủ Công</h4>
                <p className="text-[#88A393] text-[11px] leading-relaxed">
                  Đóng gói cẩn trọng từng góc cạnh chống va đập tuyệt đối.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#B88E52]">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Độc Bản Bookmark</h4>
                <p className="text-[#88A393] text-[11px] leading-relaxed">
                  Tặng kèm bookmark nghệ thuật độc quyền theo từng đơn hàng.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-[#1A3828] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4 max-w-md">
              <BookMarked className="w-10 h-10 text-[#B88E52]" />
              <blockquote className="font-serif-title text-lg italic text-[#FBF9F5] leading-relaxed">
                “Đọc một cuốn sách hay giống như được trò chuyện cùng những bộ óc kiệt xuất nhất của các thế kỷ đã qua.”
              </blockquote>
              <div className="pt-2 border-t border-white/10 text-xs text-[#A5BDB0]">
                <p className="font-bold text-white">— René Descartes</p>
                <p className="text-[11px]">Nhà triết học & toán học Pháp</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
