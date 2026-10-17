import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const isDark = variant === 'dark';

  const sizeConfigs = {
    sm: {
      icon: 'w-7 h-7 text-xs',
      title: 'text-lg',
      subtitle: 'text-[9px] tracking-[0.2em]',
    },
    md: {
      icon: 'w-9 h-9 text-sm',
      title: 'text-2xl',
      subtitle: 'text-[10px] tracking-[0.25em]',
    },
    lg: {
      icon: 'w-12 h-12 text-base',
      title: 'text-3xl sm:text-4xl',
      subtitle: 'text-xs tracking-[0.3em]',
    },
  };

  const currentSize = sizeConfigs[size];

  return (
    <Link to="/" className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Brand Monogram Icon */}
      <div
        className={`${currentSize.icon} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-xs ${
          isDark
            ? 'bg-[#2A5A42] text-[#FBF9F5] border border-white/10'
            : 'bg-[#1B3B2B] text-[#FBF9F5]'
        }`}
      >
        <BookOpen className="w-1/2 h-1/2" />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <span
          className={`font-serif-title ${currentSize.title} font-bold tracking-tight leading-none ${
            isDark ? 'text-white' : 'text-[#1C1917]'
          }`}
        >
          NOVELIA BOOKS
        </span>
        {showSubtitle && (
          <span
            className={`uppercase font-semibold mt-1 leading-none ${currentSize.subtitle} ${
              isDark ? 'text-[#B88E52]' : 'text-[#1B3B2B]'
            }`}
          >
            Editorial Bookstore
          </span>
        )}
      </div>
    </Link>
  );
};
