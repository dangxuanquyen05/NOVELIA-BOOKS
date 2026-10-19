import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'forest' | 'gold' | 'ivory' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'forest',
  size = 'sm',
  className = '',
}) => {
  const variants = {
    forest: 'bg-[#8C5D3B] text-white',
    gold: 'bg-[#D4AF7A] text-[#1C1917] font-semibold',
    ivory: 'bg-[#FAF0E6] text-[#8C5D3B] border border-[#E7E0D5]',
    rose: 'bg-rose-100 text-rose-800',
    slate: 'bg-stone-200 text-stone-800',
  };

  const sizes = {
    sm: 'text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full',
    md: 'text-xs font-semibold px-3 py-1 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center justify-center select-none shadow-xs ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
