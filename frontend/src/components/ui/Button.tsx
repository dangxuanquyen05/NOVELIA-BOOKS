import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

    // Variant styles (Terracotta Bronze + Deep Espresso + Subtle Gold + Warm Ivory)
    const variants = {
      primary:
        'bg-[#8C5D3B] text-white hover:bg-[#754C2F] active:bg-[#603D24] focus:ring-[#8C5D3B] shadow-xs hover:shadow-md transition-all',
      secondary:
        'bg-white text-[#1C1917] hover:bg-[#FAF8F5] active:bg-[#ECE4D8] focus:ring-[#8C5D3B] border border-[#DDD3C4] shadow-xs',
      outline:
        'border border-[#8C5D3B] text-[#8C5D3B] hover:bg-[#8C5D3B]/5 active:bg-[#8C5D3B]/10 focus:ring-[#8C5D3B]',
      ghost:
        'text-[#1C1917] hover:text-[#8C5D3B] hover:bg-[#8C5D3B]/5 active:bg-[#8C5D3B]/10 focus:ring-[#8C5D3B]',
      gold:
        'bg-[#B88E52] text-white hover:bg-[#A37B42] active:bg-[#8F6B38] focus:ring-[#B88E52] shadow-xs hover:shadow',
    };

    // Size styles
    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 rounded-full gap-1.5',
      md: 'text-sm px-5 py-2.5 rounded-full gap-2',
      lg: 'text-base px-7 py-3 rounded-full gap-2.5',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
