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
    forest: 'bg-[#1B3B2B] text-white',
    gold: 'bg-[#B88E52] text-white',
    ivory: 'bg-[#F4EFEB] text-[#1B3B2B] border border-[#E7E0D5]',
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
