import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import type { Cart } from '../types/cart';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  addToCart: (bookId: number, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (itemId: number, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeItem: (itemId: number) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await cartService.getMyCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: unknown) {
      console.error('Lỗi khi nạp giỏ hàng từ máy chủ:', err);
      // Giữ cart rỗng nếu lỗi
      setError('Không thể đồng bộ giỏ hàng từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (bookId: number, quantity: number = 1): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập để lưu tác phẩm vào giỏ hàng của bạn.' };
    }

    setIsLoading(true);
    try {
      const res = await cartService.addToCart(bookId, quantity);
      if (res.success) {
        setCart(res.data);
        return { success: true, message: res.message || 'Thêm vào giỏ thành công' };
      }
      return { success: false, message: res.message || 'Không thể thêm vào giỏ hàng' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi khi thêm sách vào giỏ hàng';
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated) {
      return { success: false, message: 'Yêu cầu đăng nhập' };
    }

    try {
      const res = await cartService.updateCartItem(itemId, quantity);
      if (res.success) {
        setCart(res.data);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể cập nhật số lượng';
      return { success: false, message: msg };
    }
  };

  const removeItem = async (itemId: number): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated) {
      return { success: false, message: 'Yêu cầu đăng nhập' };
    }

    try {
      const res = await cartService.removeCartItem(itemId);
      if (res.success) {
        setCart(res.data);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa mục giỏ hàng';
      return { success: false, message: msg };
    }
  };

  const clearCart = async (): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated) {
      return { success: false, message: 'Yêu cầu đăng nhập' };
    }

    try {
      const res = await cartService.clearCart();
      if (res.success) {
        setCart(res.data);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể làm trống giỏ hàng';
      return { success: false, message: msg };
    }
  };

  const itemCount = cart?.totalItems || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        error,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};
