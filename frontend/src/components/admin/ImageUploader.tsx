import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { adminBookService } from '../../services/adminBookService';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  fallbackImage?: string;
}

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Ảnh bìa sách',
  fallbackImage = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setError(null);
    setSuccessMsg(null);

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Định dạng không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WEBP hoặc GIF.');
      return;
    }

    // Validate size (5MB)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Kích thước file ảnh quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Giới hạn tối đa là ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const res = await adminBookService.uploadCoverImage(file);
      if (res.success && res.data) {
        // Construct complete URL if it's relative
        const fullUrl = res.data.url.startsWith('http')
          ? res.data.url
          : (import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080') + res.data.url;
        onChange(fullUrl);
        setUrlInput(fullUrl);
        setSuccessMsg('Tải ảnh bìa lên thành công!');
      } else {
        setError(res.message || 'Lỗi khi tải ảnh lên máy chủ');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể kết nối tải file ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    setError(null);
    setSuccessMsg(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Vui lòng nhập đường dẫn URL ảnh hợp lệ');
      return;
    }
    onChange(trimmed);
    setSuccessMsg('Đã cập nhật liên kết ảnh bìa!');
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase">
          {label}
        </label>
        <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[11px] font-medium text-stone-600">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === 'upload'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            Tải từ máy
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === 'url'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            Nhập URL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Preview Frame */}
        <div className="sm:col-span-4 flex flex-col items-center">
          <div className="relative group w-28 h-40 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs flex items-center justify-center">
            {value ? (
              <>
                <img
                  src={value}
                  alt="Ảnh bìa xem trước"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImage;
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow"
                  title="Xóa ảnh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="text-center p-3 text-stone-400">
                <ImageIcon className="w-8 h-8 mx-auto mb-1 stroke-1 text-stone-300" />
                <span className="text-[10px] block">Chưa có ảnh</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin text-white mb-1" />
                <span className="text-[10px] font-medium">Đang tải...</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-stone-400 mt-1.5 text-center">Khung tỷ lệ bìa sách 3:4</span>
        </div>

        {/* Input / Drop zone */}
        <div className="sm:col-span-8 space-y-2.5">
          {mode === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#1B3B2B] bg-[#1B3B2B]/5'
                  : 'border-stone-200 bg-stone-50/60 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-6 h-6 mx-auto mb-1.5 text-[#1B3B2B]/80" />
              <p className="text-xs font-semibold text-stone-800">
                Nhấp để tải ảnh lên hoặc kéo thả vào đây
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Tối đa {MAX_SIZE_MB}MB)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/anh-bia-sach.jpg"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#1B3B2B] focus:bg-white transition-all font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 bg-[#1B3B2B] hover:bg-[#142e22] text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                >
                  Áp dụng
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                Dán đường dẫn ảnh HTTPS trực tiếp từ website hoặc kho lưu trữ ảnh.
              </p>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !error && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
