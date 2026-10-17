import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthResponse, LoginFormData, RegisterFormData } from '../types/auth';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: Omit<RegisterFormData, 'confirmPassword'>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('novelia_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('novelia_access_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper để lưu session
  const saveSession = useCallback((authData: AuthResponse) => {
    localStorage.setItem('novelia_access_token', authData.accessToken);
    localStorage.setItem('novelia_user', JSON.stringify(authData.user));
    setToken(authData.accessToken);
    setUser(authData.user);
  }, []);

  // Xóa session khi đăng xuất
  const logout = useCallback(() => {
    localStorage.removeItem('novelia_access_token');
    localStorage.removeItem('novelia_user');
    setToken(null);
    setUser(null);
  }, []);

  // Xác minh token khi nạp ứng dụng
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('novelia_access_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('novelia_user', JSON.stringify(res.data));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [logout]);

  const login = async (data: LoginFormData) => {
    const res = await authService.login(data);
    if (res.success && res.data) {
      saveSession(res.data);
    } else {
      throw new Error(res.message || 'Đăng nhập không thành công');
    }
  };

  const register = async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
    const res = await authService.register(data);
    if (res.success && res.data) {
      saveSession(res.data);
    } else {
      throw new Error(res.message || 'Đăng ký không thành công');
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = !!user?.roles?.includes('ROLE_ADMIN');
  const isStaff = !!user?.roles?.includes('ROLE_STAFF') || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isStaff,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
