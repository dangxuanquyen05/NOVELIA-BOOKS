import React, { useState, useEffect } from 'react';
import { ShoppingBag, User as UserIcon, Menu, X, Heart, Search, BookOpen, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/books');
    }
  };

  const navLinks = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Sách', href: '/books' },
    { name: 'Tác giả', href: '/books?filter=authors' },
    { name: 'Thể loại', href: '/books?filter=categories' },
    { name: 'Khuyến mãi', href: '/books?filter=promo' },
    { name: 'Blog', href: '/bookmatch' },
  ];

  const isCurrentActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-300 border-b border-[#EAE3D8] ${isScrolled ? 'shadow-xs py-3' : 'py-3.5 sm:py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* Left: Brand Logo matching the design image */}
          <Link to="/" className="flex items-center gap-2.5 group select-none shrink-0">
            {/* Open book icon with serif Novelia brand */}
            <div className="w-9 h-9 rounded-xl bg-[#2A1D13] text-[#F5EDE4] flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <BookOpen className="w-5 h-5 text-[#E6C687]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-title text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] leading-none">
                NOVELIA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8C5D3B] leading-none mt-1">
                BOOKS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-stone-700">
            {navLinks.map((link) => {
              const active = isCurrentActive(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`relative py-1 transition-colors hover:text-[#1C1917] ${
                    active ? 'text-[#8C5D3B] font-bold' : 'text-stone-600'
                  }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#8C5D3B] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Pill Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sách, tác giả, thể loại..."
                className="w-full bg-[#FAF7F2] hover:bg-white focus:bg-white text-xs sm:text-sm text-[#1C1917] placeholder-stone-400 pl-4 pr-10 py-2 sm:py-2.5 rounded-full border border-[#E2D8CC] focus:border-[#8C5D3B] focus:outline-hidden transition-all shadow-2xs"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#8C5D3B] transition"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Action Icons: Profile, Wishlist, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search Icon button on mobile only */}
            <button
              type="button"
              onClick={() => navigate('/books')}
              aria-label="Tìm kiếm"
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-full"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Profile Dropdown / Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 p-2 rounded-full text-stone-700 hover:text-stone-900 hover:bg-[#F4EFEB] transition cursor-pointer"
                  aria-label="Tài khoản"
                >
                  <UserIcon className="w-5 h-5" />
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E8E2D8] py-2 z-50 text-xs animate-scale-up">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/customer/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#FAF7F2] text-stone-700"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Tài khoản của tôi</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-amber-50 text-[#8C5D3B] font-bold"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Quản trị hệ thống</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-rose-50 text-rose-600 text-left border-t border-stone-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 rounded-full text-stone-700 hover:text-stone-900 hover:bg-[#F4EFEB] transition"
                aria-label="Đăng nhập"
              >
                <UserIcon className="w-5 h-5" />
              </Link>
            )}

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-full text-stone-700 hover:text-stone-900 hover:bg-[#F4EFEB] transition"
              aria-label="Yêu thích"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#8C5D3B] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon with badge count */}
            <Link
              to="/cart"
              className="relative p-2 rounded-full text-stone-700 hover:text-stone-900 hover:bg-[#F4EFEB] transition"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#8C5D3B] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                {itemCount}
              </span>
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-stone-900 rounded-full"
              aria-label="Mở menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-3 border-t border-stone-200 mt-3 space-y-3 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sách, tác giả, thể loại..."
                className="w-full bg-[#FAF7F2] text-xs text-[#1C1917] placeholder-stone-400 pl-4 pr-10 py-2.5 rounded-full border border-[#E2D8CC]"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <nav className="flex flex-col space-y-1 pt-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-stone-700 hover:bg-[#FAF7F2] hover:text-[#8C5D3B]"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
