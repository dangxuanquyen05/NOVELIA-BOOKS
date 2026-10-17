import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Book } from '../types/book';

interface WishlistContextType {
  wishlist: Book[];
  wishlistCount: number;
  addToWishlist: (book: Book) => void;
  removeFromWishlist: (bookId: number) => void;
  toggleWishlist: (book: Book) => boolean;
  isInWishlist: (bookId: number) => boolean;
  clearWishlist: () => void;
}

const STORAGE_KEY = 'novelia_wishlist';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Book[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Không thể đọc danh sách yêu thích từ bộ nhớ cục bộ:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Không thể lưu danh sách yêu thích vào bộ nhớ cục bộ:', e);
    }
  }, [wishlist]);

  const isInWishlist = useCallback((bookId: number): boolean => {
    return wishlist.some((b) => b.id === bookId);
  }, [wishlist]);

  const addToWishlist = useCallback((book: Book) => {
    setWishlist((prev) => {
      if (prev.some((b) => b.id === book.id)) return prev;
      return [book, ...prev];
    });
  }, []);

  const removeFromWishlist = useCallback((bookId: number) => {
    setWishlist((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  const toggleWishlist = useCallback((book: Book): boolean => {
    let nowInWishlist = false;
    setWishlist((prev) => {
      const exists = prev.some((b) => b.id === book.id);
      if (exists) {
        nowInWishlist = false;
        return prev.filter((b) => b.id !== book.id);
      } else {
        nowInWishlist = true;
        return [book, ...prev];
      }
    });
    return nowInWishlist;
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist phải được sử dụng bên trong WishlistProvider');
  }
  return context;
};
