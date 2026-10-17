import React, { useState, useEffect } from 'react';
import { ShoppingBag, User as UserIcon, Menu, X, Heart, Sparkles, ChevronRight, Phone, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { SearchBar } from '../ui/SearchBar';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Track scroll state for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Trang Chủ', href: '/' },
    { name: 'Tất Cả Tác Phẩm', href: '/books' },
    { name: 'Văn Học Kinh Điển', href: '/books?category=van-hoc-kinh-dien' },
    { name: 'Triết Học & Tư Tưởng', href: '/books?category=triet-hoc-tu-tuong' },
    { name: 'Sách Bán Chạy', href: '/books?sortBy=rating' },
    { name: 'Sách Mới', href: '/books?sortBy=newest' },
  ];

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      {/* Top Editorial Bar */}
      <div className="bg-[#12281D] text-[#EBF2ED] text-[11px] sm:text-xs py-2 px-4 border-b border-[#1B3B2B]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-[#B88E52]" />
            <span className="font-medium">
              NOVELIA BOOKS — Không gian tuyển tập những tác phẩm văn học & tri thức kinh điển
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-[#D5DFD9]">
            <span className="flex items-center gap-1.5 hover:text-white transition">
              <Phone className="w-3.5 h-3.5 text-[#B88E52]" /> Hotline: 1900 888 999
            </span>
            <span className="text-[#88A393]">|</span>
            <span className="hover:text-white transition cursor-pointer">
              Giao Hàng Miễn Phí Từ 500K
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div
        className={`bg-[#FBF9F5]/95 backdrop-blur-md border-b transition-all duration-200 ${
          isScrolled
            ? 'border-[#E2DDD5] shadow-sm py-3'
            : 'border-[#EDE8E0] py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Mobile Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -ml-2 rounded-xl text-stone-800 hover:bg-[#F4EFEB] transition cursor-pointer"
                aria-label="Mở menu điều hướng"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Brand Logo */}
            <Logo size="md" />

            {/* Desktop Center Search */}
            <div className="hidden lg:block flex-1 max-w-md mx-4">
              <SearchBar
                placeholder="Tìm kiếm theo tựa sách, ISBN, tác giả..."
                onSearch={(q) => {
                  if (q.trim()) {
                    navigate(`/books?keyword=${encodeURIComponent(q.trim())}`);
                  } else {
                    navigate('/books');
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Wishlist */}
              <Link
                to="/wishlist"
                aria-label="Sách yêu thích"
                className="relative hidden sm:flex p-2.5 rounded-full text-stone-700 hover:text-[#1B3B2B] hover:bg-[#F4EFEB] transition cursor-pointer"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-scale-up">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* User Account Dropdown */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-label="Tài khoản cá nhân"
                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-full text-stone-700 hover:text-[#1B3B2B] hover:bg-[#F4EFEB] transition cursor-pointer flex items-center gap-2 border border-[#E7E0D5]"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#1B3B2B] text-white flex items-center justify-center text-xs font-bold font-serif-title">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden xl:inline text-xs font-semibold max-w-[120px] truncate">
                      {user.fullName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E7E0D5] py-2 z-50 text-xs animate-fade-in">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="font-bold text-stone-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/customer/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-stone-700 hover:bg-[#F4EFEB] hover:text-[#1B3B2B] transition"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        to="/customer/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-stone-700 hover:bg-[#F4EFEB] hover:text-[#1B3B2B] transition"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#1B3B2B]" />
                        <span>Đơn hàng của tôi</span>
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-[#B88E52] hover:bg-amber-50 transition font-bold"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Bảng Điều Khiển</span>
                          </Link>
                          <Link
                            to="/admin/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-1.5 text-stone-700 hover:bg-stone-50 transition text-xs font-medium"
                          >
                            <span>Quản lý Đơn hàng</span>
                          </Link>
                          <Link
                            to="/admin/inventory"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-1.5 text-stone-700 hover:bg-stone-50 transition text-xs font-medium"
                          >
                            <span>Quản lý Tồn kho</span>
                          </Link>
                          <Link
                            to="/admin/books"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-1.5 text-stone-700 hover:bg-stone-50 transition text-xs font-medium"
                          >
                            <span>Quản lý Sách</span>
                          </Link>
                          <Link
                            to="/admin/categories"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-1.5 text-stone-700 hover:bg-stone-50 transition text-xs font-medium"
                          >
                            <span>Quản lý Danh mục</span>
                          </Link>
                          <Link
                            to="/admin/authors"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-1.5 text-stone-700 hover:bg-stone-50 transition text-xs font-medium"
                          >
                            <span>Quản lý Tác giả</span>
                          </Link>
                          <Link
                            to="/admin/customers"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-1.5 text-stone-700 hover:bg-stone-50 transition text-xs font-medium"
                          >
                            <span>Quản lý Khách hàng</span>
                          </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer border-t border-stone-100"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-800 hover:text-[#1B3B2B] hover:bg-[#F4EFEB] transition"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B3B2B] text-white hover:bg-[#25523D] transition shadow-xs"
                  >
                    Đăng Ký
                  </Link>
                </div>
              )}

              {/* Cart Button */}
              <Link
                to="/cart"
                aria-label="Giỏ hàng của bạn"
                className="relative p-2.5 rounded-full text-white bg-[#1B3B2B] hover:bg-[#25523D] transition cursor-pointer shadow-xs flex items-center justify-center"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B88E52] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-scale-up">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center justify-start gap-8 mt-4 pt-3 border-t border-[#EFEAE2] text-xs font-semibold tracking-wide uppercase">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="text-stone-700 hover:text-[#1B3B2B] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#1B3B2B] hover:after:w-full after:transition-all"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Search Bar (under header) */}
      <div className="block lg:hidden px-4 py-2.5 bg-[#FAF7F2] border-b border-[#EAE4DC]">
        <SearchBar
          placeholder="Tìm kiếm sách, tác giả, ISBN..."
          onSearch={(q) => {
            if (q.trim()) {
              navigate(`/books?keyword=${encodeURIComponent(q.trim())}`);
            } else {
              navigate('/books');
            }
          }}
        />
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#FBF9F5] shadow-2xl flex flex-col z-10 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE4DC]">
              <Logo size="sm" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-stone-600 hover:bg-[#F4EFEB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col space-y-2 flex-1 overflow-y-auto">
              {navLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-[#F4EFEB] hover:text-[#1B3B2B] transition"
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </a>
              ))}

              <Link
                to="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50/50 hover:bg-rose-50 transition"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>Sách Yêu Thích</span>
                </span>
                {wishlistCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </nav>

            <div className="pt-4 border-t border-[#EAE4DC] space-y-3">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#EDF3EF] text-xs">
                    <p className="font-bold text-[#1B3B2B]">{user.fullName}</p>
                    <p className="text-[11px] text-stone-600">{user.email}</p>
                  </div>
                  <Link
                    to="/customer/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-semibold rounded-full bg-[#1B3B2B] text-white block"
                  >
                    Hồ Sơ Của Tôi
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center text-xs font-semibold rounded-full bg-[#B88E52] text-white block"
                    >
                      Bảng Điều Khiển Quản Trị
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 text-center text-xs font-semibold text-rose-600 block"
                  >
                    Đăng Xuất
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-semibold rounded-full bg-[#1B3B2B] text-white block"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-semibold rounded-full bg-[#F4EFEB] text-stone-900 border border-[#E7E0D5] block"
                  >
                    Đăng Ký Tài Khoản
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
