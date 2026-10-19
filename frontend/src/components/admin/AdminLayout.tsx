import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Warehouse,
  BookOpen,
  FolderTree,
  Feather,
  Users,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  BookMarked,
  Tag,
  MessageSquare,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    {
      label: 'Tổng quan',
      path: '/admin',
      activePaths: ['/admin', '/admin/dashboard'],
      icon: LayoutDashboard,
    },
    {
      label: 'Báo cáo kinh doanh',
      path: '/admin/reports',
      activePaths: ['/admin/reports'],
      icon: TrendingUp,
    },
    {
      label: 'Đơn hàng',
      path: '/admin/orders',
      activePaths: ['/admin/orders'],
      icon: ShoppingBag,
    },
    {
      label: 'Kho & Biến động',
      path: '/admin/inventory',
      activePaths: ['/admin/inventory'],
      icon: Warehouse,
    },
    {
      label: 'Quản lý Sách',
      path: '/admin/books',
      activePaths: ['/admin/books'],
      icon: BookOpen,
    },
    {
      label: 'Danh mục',
      path: '/admin/categories',
      activePaths: ['/admin/categories'],
      icon: FolderTree,
    },
    {
      label: 'Tác giả',
      path: '/admin/authors',
      activePaths: ['/admin/authors'],
      icon: Feather,
    },
    {
      label: 'Khách hàng',
      path: '/admin/customers',
      activePaths: ['/admin/customers'],
      icon: Users,
    },
    {
      label: 'Mã ưu đãi',
      path: '/admin/coupons',
      activePaths: ['/admin/coupons'],
      icon: Tag,
    },
    {
      label: 'Kiểm duyệt đánh giá',
      path: '/admin/reviews',
      activePaths: ['/admin/reviews'],
      icon: MessageSquare,
    },
    {
      label: 'Nhật ký kiểm toán',
      path: '/admin/audit-logs',
      activePaths: ['/admin/audit-logs'],
      icon: ShieldAlert,
      adminOnly: true,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRoleAdmin = user?.roles?.some((r: any) =>
    (typeof r === 'string' ? r : r.name) === 'ROLE_ADMIN'
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col lg:flex-row text-[#1C1917]">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#1C1815] text-white px-4 py-3 flex items-center justify-between border-b border-[#2E2620]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#8C5D3B] text-white flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif-title font-bold text-lg tracking-wide">NOVELIA BOOKS</span>
          <span className="text-[10px] bg-[#8C5D3B]/20 text-[#D4AF7A] px-2 py-0.5 rounded-full uppercase font-semibold border border-[#8C5D3B]/30">Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-white/80 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#1C1815] text-white transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} border-r border-[#2E2620]`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-[#2E2620] flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/admin" className="flex items-center gap-3 group overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#8C5D3B] flex items-center justify-center text-white font-bold shadow-md shrink-0 transition-transform group-hover:scale-105">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <h1 className="font-serif-title font-bold text-lg text-white leading-tight tracking-wider truncate">
                  NOVELIA
                </h1>
                <p className="text-[10px] font-sans text-[#D4AF7A] tracking-widest uppercase truncate font-bold">
                  Quản Trị Nhà Sách
                </p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Info */}
        {!sidebarCollapsed ? (
          <div className="px-4 py-3 mx-3 my-3 rounded-2xl bg-[#26201B] border border-[#382E27] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8C5D3B]/20 text-[#D4AF7A] flex items-center justify-center font-bold text-sm border border-[#8C5D3B]/40 shrink-0">
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Quản trị viên'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-[#D4AF7A]" />
                <span className="text-[10px] text-[#D4AF7A] font-medium tracking-wide">
                  {isRoleAdmin ? 'Quản Trị Viên (Admin)' : 'Nhân Viên (Staff)'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-3 flex justify-center">
            <div
              className="w-10 h-10 rounded-full bg-[#8C5D3B]/20 text-[#D4AF7A] flex items-center justify-center font-bold text-sm border border-[#8C5D3B]/40 cursor-default"
              title={`${user?.fullName || 'Quản trị viên'} (${isRoleAdmin ? 'Admin' : 'Staff'})`}
            >
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.filter((item) => !item.adminOnly || isRoleAdmin).map((item) => {
            const Icon = item.icon;
            const isActive = item.activePaths.includes(location.pathname);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  sidebarCollapsed
                    ? 'justify-center py-2.5 px-0'
                    : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#8C5D3B] text-white font-semibold shadow-md shadow-[#8C5D3B]/20'
                    : 'text-stone-300 hover:bg-[#2A231E] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#D4AF7A]'}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#2E2620] space-y-2">
          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl text-xs font-medium text-stone-300 hover:bg-[#2A231E] hover:text-white transition-colors"
            title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#D4AF7A]" />
            ) : (
              <span className="flex items-center gap-2">
                <PanelLeftClose className="w-4 h-4 text-[#D4AF7A]" />
                <span>Thu gọn menu</span>
              </span>
            )}
          </button>

          <Link
            to="/"
            title="Xem Cửa Hàng"
            className={`flex items-center rounded-xl text-xs font-medium text-stone-300 hover:bg-[#2A231E] hover:text-white transition-colors ${
              sidebarCollapsed ? 'justify-center py-2' : 'justify-between px-3.5 py-2'
            }`}
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF7A] shrink-0" />
              {!sidebarCollapsed && <span>Xem Cửa Hàng</span>}
            </span>
            {!sidebarCollapsed && (
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-stone-300 font-medium">Storefront</span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className={`flex items-center rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors ${
              sidebarCollapsed ? 'justify-center py-2 w-full' : 'gap-2 w-full px-3.5 py-2'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Topbar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-[#E7E0D5] px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-[#8C5D3B]" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-stone-600" />
              )}
            </button>
            <div>
              <h1 className="font-serif-title text-xl font-bold text-[#1C1917]">
                {title || 'Bảng Điều Khiển Quản Trị'}
              </h1>
              {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0E6] border border-[#E8D7C5] text-xs text-[#8C5D3B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Hệ thống hoạt động bình thường</span>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-stone-800">{user?.fullName}</p>
              <div className="flex items-center justify-end gap-1.5 text-[11px] text-stone-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8C5D3B]" />
                <span>{isRoleAdmin ? 'Quản trị viên' : 'Nhân viên'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
