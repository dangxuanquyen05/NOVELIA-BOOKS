import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8C5D3B]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white border border-rose-200 text-center shadow-lg space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="font-serif-title text-xl font-bold text-stone-900">
          Khu Vực Hạn Chế Truy Cập
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          Tài khoản của bạn không có đặc quyền <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-rose-700">ROLE_ADMIN</code> để quản lý hệ thống.
        </p>
        <Button variant="primary" size="md" onClick={() => window.location.href = '/'}>
          Về Trang Chủ
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
