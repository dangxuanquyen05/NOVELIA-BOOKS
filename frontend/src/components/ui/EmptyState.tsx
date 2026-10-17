import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không tìm thấy tác phẩm nào',
  description = 'Hiện chưa có sách nào phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc từ khóa.',
  icon,
  actionText = 'Xem toàn bộ sách',
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-white border border-[#EBE5DC] my-8 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#EDF3EF] text-[#1B3B2B] flex items-center justify-center mb-5 shadow-xs">
        {icon || <BookOpen className="w-8 h-8 stroke-[1.5]" />}
      </div>

      <h3 className="font-serif-title text-xl sm:text-2xl font-bold text-[#1C1917] mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#6E6862] max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
