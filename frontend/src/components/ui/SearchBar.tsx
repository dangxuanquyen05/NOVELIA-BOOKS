import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import type { Book } from '../../types/book';
import { formatCurrencyVND } from '../../utils/format';

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Tìm kiếm tựa sách, tác giả, nhà xuất bản...',
  onSearch,
  className = '',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounced live search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      bookService.searchBooks(query.trim(), 0, 5)
        .then((res) => {
          if (res.success && res.data) {
            setResults(res.data.content || []);
            setIsOpen(true);
          }
        })
        .catch((err: unknown) => {
          console.error('Lỗi tìm kiếm trực tiếp:', err);
          setResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onSearch) onSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/books?keyword=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleSelectBook = (slug: string) => {
    setIsOpen(false);
    navigate(`/books/${slug}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#1B3B2B] transition-colors">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-2.5 sm:py-3 text-xs sm:text-sm rounded-full bg-white/95 border border-[#E2DDD5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#1B3B2B] focus:ring-2 focus:ring-[#1B3B2B]/10 shadow-xs hover:border-[#D1C9BE] transition-all"
        />

        <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1">
          {isLoading && (
            <div className="p-1.5 text-stone-400 animate-spin">
              <Loader2 className="w-3.5 h-3.5" />
            </div>
          )}

          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition cursor-pointer"
              aria-label="Xóa từ khóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#1B3B2B] text-white hover:bg-[#25523D] transition cursor-pointer"
          >
            Tìm
          </button>
        </div>
      </form>

      {/* Instant Search Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#E2DDD5] overflow-hidden z-50 animate-fade-in max-h-[420px] flex flex-col">
          <div className="px-4 py-2 bg-[#F9F7F3] border-b border-[#EDE7DD] flex items-center justify-between text-[11px] text-stone-500 font-semibold">
            <span>Gợi ý tìm kiếm trực tiếp</span>
            <span>{results.length} tác phẩm</span>
          </div>

          <div className="overflow-y-auto divide-y divide-stone-100 p-1">
            {results.length > 0 ? (
              results.map((book) => {
                const authors = book.authors?.map((a) => a.name).join(', ') || 'NOVELIA';
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => handleSelectBook(book.slug)}
                    className="w-full p-2.5 flex items-center gap-3 hover:bg-[#F6F3EE] rounded-xl transition text-left cursor-pointer group"
                  >
                    <img
                      src={book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded-md shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-serif-title font-bold text-stone-900 group-hover:text-[#1B3B2B] truncate transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate">{authors}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold font-mono text-[#1B3B2B]">
                          {formatCurrencyVND(book.salePrice)}
                        </span>
                        {book.originalPrice && book.originalPrice > book.salePrice && (
                          <span className="text-[10px] text-stone-400 line-through font-mono">
                            {formatCurrencyVND(book.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center space-y-2">
                <BookOpen className="w-6 h-6 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500">
                  Không tìm thấy tác phẩm nào khớp với "{query}"
                </p>
              </div>
            )}
          </div>

          {/* Footer: View all results */}
          <div className="p-2.5 bg-[#FAF8F5] border-t border-[#EDE7DD]">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-[#1B3B2B] hover:bg-[#EAE4D9] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Xem tất cả kết quả cho "{query}"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
