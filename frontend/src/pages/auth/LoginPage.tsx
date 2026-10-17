import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy trang trước đó để redirect (mặc định về trang chủ)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Đăng nhập không thành công. Vui lòng thử lại.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-[#E7E0D5] shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EDF3EF] text-[#1B3B2B] flex items-center justify-center mx-auto mb-2 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Đăng Nhập
          </h1>
          <p className="text-xs text-[#78716C] leading-relaxed">
            Chào mừng bạn quay trở lại với không gian văn học NOVELIA BOOKS
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Địa chỉ Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="reader@noveliabooks.vn"
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
          />

          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••"
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-stone-600">
              <input type="checkbox" className="rounded text-[#1B3B2B] focus:ring-[#1B3B2B]" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#forgot" className="text-[#1B3B2B] hover:underline font-semibold">
              Quên mật khẩu?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="mt-2"
          >
            Đăng Nhập
          </Button>
        </form>

        {/* Register Link */}
        <div className="pt-4 border-t border-[#F2ECE4] text-center text-xs text-[#78716C]">
          <span>Chưa có tài khoản độc giả? </span>
          <Link to="/register" className="text-[#1B3B2B] font-bold hover:underline">
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};
