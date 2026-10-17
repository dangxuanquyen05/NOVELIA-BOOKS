import React, { useState } from 'react';
import { X, BookOpen, ShoppingBag, Heart } from 'lucide-react';
import type { Book } from '../../types/book';
import { formatCurrencyVND } from '../../utils/format';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export interface BookSampleModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

type ReaderTheme = 'sepia' | 'light' | 'dark';
type FontSize = 'sm' | 'md' | 'lg';

// Curated excerpts for classic and featured masterpieces
const SAMPLE_EXCERPTS: Record<string, { chapter: string; subtitle: string; content: string[] }> = {
  'rung-na-uy-bia-cung': {
    chapter: 'Chương I: Giai Điệu Trên Bầu Trời Hamburg',
    subtitle: 'Ký ức về một thời thanh xuân xa xôi và những khắc khoải khôn nguôi',
    content: [
      'Chiếc máy bay Boeing 747 bắt đầu hạ cánh xuyên qua những tầng mây dày đặc. Mưa lạnh tháng Mười Một nhuộm cả đất trời thành một màu xám ảm đạm. Khi bánh xe chạm đường băng của sân bay Hamburg, những nốt nhạc quen thuộc của bản "Norwegian Wood" từ ban nhạc The Beatles cất lên qua hệ thống loa phát thanh.',
      'Giai điệu dịu êm ấy luôn làm tôi bàng hoàng run rẩy. Nhưng lần này, nó ập đến dữ dội hơn bao giờ hết, tựa như một cơn bão quét qua tâm can. Tôi cúi gập người, hai tay ôm lấy mặt, lồng ngực thắt lại trong nỗi đau đớn không lời.',
      'Cô tiếp viên người Đức bước lại gần, ân cần hỏi xem tôi có cần sự giúp đỡ. "Không, cảm ơn cô. Tôi chỉ hơi mệt một chút thôi," tôi đáp. Nhưng trong thâm tâm, tôi biết mình vừa đánh mất thứ gì đó mãi mãi không thể tìm lại được giữa dòng chảy của thời gian.',
      'Đó là Naoko. Mái tóc đen mềm mại, đôi mắt trong veo phảng phất nét u uất của đồng cỏ mùa thu. Mười tám năm đã trôi qua, biết bao ký ức đã phai nhạt, nhưng hương thơm của buổi chiều thảo nguyên hôm ấy vẫn còn vương vất đâu đây trong từng hơi thở...',
    ],
  },
  'nha-gia-kim-an-ban-gioi-han': {
    chapter: 'Phần I: Giấc Mơ Dưới Cây Vả Hoang',
    subtitle: 'Hành trình đi tìm Vận Mệnh Cá Nhân và lắng nghe tiếng nói vũ trụ',
    content: [
      'Chàng chăn cừu tên là Santiago. Trời đã bắt đầu sẩm tối khi chàng lùa đàn cừu đến một nhà thờ cổ đã bị bỏ hoang từ lâu. Mái nhà thờ đã sập từ bao năm trước, và ngay tại nơi từng là phòng thánh, nay mọc lên một cây vả khổng lồ.',
      'Chàng quyết định nghỉ đêm tại đây. Chàng lùa lũ cừu qua khung cửa gỗ mục nát, rồi dùng vài tấm ván chặn lại để chúng không đi lang thang trong đêm. Trải chiếc áo khoác cũ lên sàn đất, chàng gối đầu lên cuốn sách vừa đọc xong và nhắm mắt lại.',
      'Khi tỉnh giấc, trời vẫn còn đầy sao. Santiago nhìn lên những vì tinh tú lấp lánh qua trần nhà thờ đổ nát. Một lần nữa, chàng lại mơ thấy giấc mơ kỳ lạ ấy: một đứa trẻ nắm tay chàng, dắt tới chân những Kim Tự Tháp hùng vĩ bên bờ sông Nile và thì thầm: "Nếu tới đây, anh sẽ tìm thấy kho báu giấu kín của cuộc đời mình."',
      '"Khi bạn thực sự khao khát một điều gì đó, toàn bộ vũ trụ sẽ hợp lực lại để giúp bạn đạt được ước mơ," lời người thông thái xứ Salem văng vẳng bên tai chàng giữa sa mạc bao la vô tận...',
    ],
  },
};

const DEFAULT_SAMPLE = {
  chapter: 'Trích Đoạn Ấn Phẩm Tinh Hoa',
  subtitle: 'Những trang văn khai mở tư tưởng và cảm xúc sâu sắc nhất',
  content: [
    'Từng trang sách mở ra như một cánh cửa bước vào thế giới nội tâm của tác giả. Từng câu chữ được gọt giũa tỉ mỉ, lắng đọng sau những năm tháng trải nghiệm và chiêm nghiệm sâu sắc về cuộc đời, con người và nghệ thuật sống.',
    'Đọc sách không chỉ đơn thuần là tiếp nhận thông tin, mà là một cuộc đối thoại chân thành giữa hai tâm hồn qua không gian và thời gian. Khi bạn đắm mình vào từng dòng tư tưởng này, bạn sẽ nhận ra những góc nhìn hoàn toàn mới về những điều bình dị quanh mình.',
    'Đây là ấn phẩm đặc biệt được in trên chất liệu giấy mỹ thuật cao cấp, bảo tồn nguyên vẹn giá trị tinh hoa của văn chương và mỹ thuật xuất bản đỉnh cao.',
  ],
};

export const BookSampleModal: React.FC<BookSampleModalProps> = ({ book, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [theme, setTheme] = useState<ReaderTheme>('sepia');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  if (!isOpen) return null;

  const excerpt = SAMPLE_EXCERPTS[book.slug] || DEFAULT_SAMPLE;
  const wishlisted = isInWishlist(book.id);

  const themeClasses: Record<ReaderTheme, { bg: string; text: string; headerBg: string; border: string }> = {
    sepia: {
      bg: 'bg-[#FAF6EE]',
      text: 'text-[#2D2821]',
      headerBg: 'bg-[#F2ECE0]',
      border: 'border-[#E5DDCF]',
    },
    light: {
      bg: 'bg-white',
      text: 'text-stone-900',
      headerBg: 'bg-stone-50',
      border: 'border-stone-200',
    },
    dark: {
      bg: 'bg-[#18191B]',
      text: 'text-[#E4E4E6]',
      headerBg: 'bg-[#212326]',
      border: 'border-[#2E3136]',
    },
  };

  const fontClasses: Record<FontSize, string> = {
    sm: 'text-sm sm:text-base leading-relaxed sm:leading-loose',
    md: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    lg: 'text-lg sm:text-xl leading-loose sm:leading-[2.2]',
  };

  const activeTheme = themeClasses[theme];

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(book.id, 1);
    setIsAdding(false);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden transition-colors duration-200 ${activeTheme.bg} border ${activeTheme.border}`}
      >
        {/* Header Bar */}
        <div
          className={`flex items-center justify-between px-5 sm:px-8 py-3.5 border-b ${activeTheme.headerBg} ${activeTheme.border}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <BookOpen className="w-5 h-5 text-[#B88E52] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B88E52] block truncate">
                Đọc Thử Tác Phẩm • Tuyển Chọn
              </span>
              <h2 className={`font-serif-title text-sm sm:text-base font-bold truncate ${activeTheme.text}`}>
                {book.title}
              </h2>
            </div>
          </div>

          {/* Reader Controls & Close */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Font Size Toggle */}
            <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                  fontSize === 'sm' ? 'bg-[#1B3B2B] text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
                }`}
                title="Cỡ chữ nhỏ"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('md')}
                className={`px-2 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                  fontSize === 'md' ? 'bg-[#1B3B2B] text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
                }`}
                title="Cỡ chữ vừa"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                  fontSize === 'lg' ? 'bg-[#1B3B2B] text-white shadow-xs' : 'text-stone-600 dark:text-stone-300'
                }`}
                title="Cỡ chữ lớn"
              >
                A+
              </button>
            </div>

            {/* Theme Switches */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={`w-6 h-6 rounded-full border transition cursor-pointer bg-[#FAF6EE] border-[#D8CDBA] ${
                  theme === 'sepia' ? 'ring-2 ring-[#B88E52] ring-offset-1' : ''
                }`}
                title="Nền giấy ngà Sepia"
              />
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`w-6 h-6 rounded-full border transition cursor-pointer bg-white border-stone-300 ${
                  theme === 'light' ? 'ring-2 ring-[#1B3B2B] ring-offset-1' : ''
                }`}
                title="Nền trắng thanh lịch"
              />
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`w-6 h-6 rounded-full border transition cursor-pointer bg-[#1C1D1F] border-stone-700 ${
                  theme === 'dark' ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                }`}
                title="Nền tối ban đêm"
              />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-700/50 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition cursor-pointer ml-1"
              aria-label="Đóng đọc thử"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Excerpt Reading Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-16 py-8 sm:py-12 space-y-6">
          {/* Chapter Heading */}
          <div className="text-center space-y-2 border-b pb-6 border-current/10">
            <span className="text-xs uppercase font-serif-title tracking-widest text-[#B88E52] block">
              Trích Đoạn Tuyển Chọn
            </span>
            <h3 className={`font-serif-title text-xl sm:text-2xl md:text-3xl font-bold ${activeTheme.text}`}>
              {excerpt.chapter}
            </h3>
            <p className="text-xs sm:text-sm italic opacity-75 max-w-lg mx-auto font-serif-body">
              {excerpt.subtitle}
            </p>
          </div>

          {/* Book Information Mini Badge */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs opacity-75 font-serif-body py-1">
            <span>Tác giả: <strong>{book.authors?.map((a) => a.name).join(', ') || 'NOVELIA'}</strong></span>
            <span>•</span>
            <span>NXB: <strong>{book.publisher || 'Hội Nhà Văn'}</strong></span>
            <span>•</span>
            <span>Số trang: <strong>{book.pages || 350} trang</strong></span>
          </div>

          {/* Story Paragraphs */}
          <div className={`space-y-5 font-serif-body text-justify ${fontClasses[fontSize]} ${activeTheme.text}`}>
            {excerpt.content.map((paragraph, idx) => (
              <p
                key={idx}
                className={idx === 0 ? 'first-letter:text-4xl sm:first-letter:text-5xl first-letter:font-bold first-letter:font-serif-title first-letter:float-left first-letter:mr-2.5 first-letter:text-[#B88E52] first-letter:leading-none' : ''}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Watermark Quote */}
          <div className="pt-8 border-t border-current/10 text-center space-y-2">
            <p className="text-xs italic opacity-60 font-serif-body">
              "Trang sách khép lại, nhưng chân trời suy tưởng vừa mới bắt đầu."
            </p>
            <p className="text-[11px] font-semibold text-[#B88E52]">
              — Tuyển tập tác phẩm đặc sắc tại NOVELIA BOOKS —
            </p>
          </div>
        </div>

        {/* Footer Quick Action Bar */}
        <div
          className={`px-6 sm:px-8 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 ${activeTheme.headerBg} ${activeTheme.border}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-75">Giá niêm yết:</span>
            <span className="text-base sm:text-lg font-bold font-mono text-[#1B3B2B] dark:text-emerald-400">
              {formatCurrencyVND(book.salePrice)}
            </span>
            {book.originalPrice && book.originalPrice > book.salePrice && (
              <span className="text-xs line-through opacity-50 font-mono">
                {formatCurrencyVND(book.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => toggleWishlist(book)}
              className={`p-2.5 rounded-full border transition cursor-pointer flex items-center justify-center ${
                wishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'border-current/20 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={wishlisted ? 'Đã lưu vào yêu thích' : 'Lưu vào yêu thích'}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || book.stockQuantity <= 0}
              className="px-5 py-2 rounded-full text-xs font-bold bg-[#1B3B2B] text-white hover:bg-[#25523D] transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{addSuccess ? 'Đã thêm vào giỏ!' : 'Thêm Vào Giỏ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
