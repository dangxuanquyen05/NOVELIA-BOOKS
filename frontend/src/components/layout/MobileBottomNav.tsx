import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#EAE3D8] z-30 py-2 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 items-center justify-items-center max-w-md mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#8C5D3B] font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Trang chủ</span>
        </NavLink>

        <NavLink
          to="/books"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#8C5D3B] font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Danh mục</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#8C5D3B] font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#8C5D3B] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </div>
          <span>Giỏ hàng</span>
        </NavLink>

        <NavLink
          to={isAuthenticated ? '/customer/profile' : '/login'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              isActive ? 'text-[#8C5D3B] font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Tài khoản</span>
        </NavLink>
      </div>
    </nav>
  );
};
