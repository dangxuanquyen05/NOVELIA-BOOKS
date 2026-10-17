import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { Logo } from '../common/Logo';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#12281D] text-[#E5ECE7] border-t border-[#1C3E2E] mt-20">
      {/* Editorial Value Strip */}
      <div className="border-b border-white/10 py-8 bg-[#0D1E16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#B88E52]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Tuyển Chọn Tinh Hoa</h4>
                <p className="text-[11px] text-[#A5BDB0]">Kiểm duyệt chất lượng nội dung</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#B88E52]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Bảo Vệ Sách 100%</h4>
                <p className="text-[11px] text-[#A5BDB0]">Đóng gói 3 lớp chống va đập</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#B88E52]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Đổi Trả 7 Ngày</h4>
                <p className="text-[11px] text-[#A5BDB0]">Nếu phát hiện lỗi in ấn</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#B88E52]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Đồng Hành 24/7</h4>
                <p className="text-[11px] text-[#A5BDB0]">Hotline: 1900 888 999</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="dark" size="md" />

            <p className="text-xs sm:text-sm text-[#A9C1B4] leading-relaxed max-w-sm pt-2 font-light">
              NOVELIA BOOKS là không gian văn hóa nơi hội tụ những áng văn kinh điển, tác phẩm triết học khai sáng và những ấn bản nghệ thuật được chế tác công phu dành cho người say mê cái đẹp.
            </p>

            <div className="space-y-2 pt-2 text-xs text-[#A9C1B4]">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B88E52]" />
                <span>124 Đường Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B88E52]" />
                <span>Tổng đài CSKH: 1900 888 999 (08:00 - 21:00)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#B88E52]" />
                <span>contact@noveliabooks.vn</span>
              </p>
            </div>
          </div>

          {/* Quick Links 1 */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-white tracking-wide">
              Bộ Sưu Tập
            </h4>
            <ul className="space-y-2 text-xs text-[#A9C1B4]">
              <li><a href="#classic" className="hover:text-white transition">Văn Học Cổ Điển</a></li>
              <li><a href="#philosophy" className="hover:text-white transition">Triết Học & Hiện Sinh</a></li>
              <li><a href="#art" className="hover:text-white transition">Mỹ Học & Thiết Kế</a></li>
              <li><a href="#business" className="hover:text-white transition">Kinh Tế & Quản Trị</a></li>
              <li><a href="#special" className="hover:text-white transition">Ấn Bản Kỷ Niệm Bìa Cứng</a></li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-white tracking-wide">
              Chính Sách & Dịch Vụ
            </h4>
            <ul className="space-y-2 text-xs text-[#A9C1B4]">
              <li><a href="#faq" className="hover:text-white transition">Câu hỏi thường gặp</a></li>
              <li><a href="#shipping" className="hover:text-white transition">Chính sách vận chuyển</a></li>
              <li><a href="#return" className="hover:text-white transition">Đổi trả và hoàn tiền</a></li>
              <li><a href="#privacy" className="hover:text-white transition">Bảo mật thông tin cá nhân</a></li>
              <li><a href="#terms" className="hover:text-white transition">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-white tracking-wide">
              Bản Tin Văn Học
            </h4>
            <p className="text-xs text-[#A9C1B4] leading-relaxed">
              Nhận bài viết bình phẩm sách tuyển chọn và thông báo ấn bản độc quyền mỗi tuần.
            </p>

            {isSubscribed ? (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Cảm ơn bạn đã đồng hành cùng NOVELIA BOOKS!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Địa chỉ email của bạn..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-stone-400 focus:outline-none focus:border-[#B88E52]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#B88E52] hover:bg-[#A37B42] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Đăng ký nhận thư</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7F9A8C] gap-4">
          <p>© {new Date().getFullYear()} NOVELIA BOOKS. Toàn quyền bảo lưu.</p>
          <p className="text-center sm:text-right font-light">
            Không gian văn hóa đọc Modern Editorial Bookstore tại Việt Nam.
          </p>
        </div>
      </div>
    </footer>
  );
};
