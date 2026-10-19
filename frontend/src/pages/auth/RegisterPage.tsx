import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, User, Phone, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
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
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      });

      // Điều hướng về trang chủ sau khi đăng ký & tự động cấp session thành công
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Đăng ký tài khoản không thành công. Vui lòng thử lại.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-[#E7E0D5] shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#2A1D13] text-[#E6C687] flex items-center justify-center mx-auto mb-2 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Tạo Tài Khoản Độc Giả
          </h1>
          <p className="text-xs text-[#78716C] leading-relaxed">
            Đồng hành cùng cộng đồng người yêu sách tinh hoa NOVELIA BOOKS
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
            label="Họ và tên"
            value={formData.fullName}
            onChange={(e) => {
              setFormData({ ...formData, fullName: e.target.value });
              if (errors.fullName) setErrors({ ...errors, fullName: '' });
            }}
            placeholder="Nguyễn Văn A"
            error={errors.fullName}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Địa chỉ Email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder="reader@noveliabooks.vn"
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
          />

          <Input
            label="Số điện thoại (tùy chọn)"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0912 345 678"
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              placeholder="Tối thiểu 6 ký tự"
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="Nhập lại mật khẩu"
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />
          </div>

          {/* Policy Agreement */}
          <div className="text-[11px] text-[#78716C] leading-relaxed pt-1">
            Bằng việc đăng ký, bạn đồng ý với các{' '}
            <a href="#terms" className="text-[#8C5D3B] font-semibold hover:underline">
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a href="#privacy" className="text-[#8C5D3B] font-semibold hover:underline">
              Chính sách bảo mật
            </a>{' '}
            của NOVELIA BOOKS.
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
            Đăng Ký Tài Khoản
          </Button>
        </form>

        {/* Login Link */}
        <div className="pt-4 border-t border-[#F2ECE4] text-center text-xs text-[#78716C]">
          <span>Đã có tài khoản độc giả? </span>
          <Link to="/login" className="text-[#8C5D3B] font-bold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
