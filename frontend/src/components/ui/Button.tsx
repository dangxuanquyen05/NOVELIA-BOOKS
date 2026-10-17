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

    // Variant styles (Forest green + Warm Ivory + Subtle Gold)
    const variants = {
      primary:
        'bg-[#1B3B2B] text-white hover:bg-[#25523D] active:bg-[#152E22] focus:ring-[#1B3B2B] shadow-sm hover:shadow',
      secondary:
        'bg-[#F4EFEB] text-[#1C1917] hover:bg-[#EAE2DA] active:bg-[#DFD5C9] focus:ring-[#D8CFBE] border border-[#E7E0D5]',
      outline:
        'border border-[#1B3B2B] text-[#1B3B2B] hover:bg-[#1B3B2B]/5 active:bg-[#1B3B2B]/10 focus:ring-[#1B3B2B]',
      ghost:
        'text-[#1C1917] hover:text-[#1B3B2B] hover:bg-[#1B3B2B]/5 active:bg-[#1B3B2B]/10 focus:ring-[#1B3B2B]',
      gold:
        'bg-[#B88E52] text-white hover:bg-[#A37B42] active:bg-[#8F6B38] focus:ring-[#B88E52] shadow-sm hover:shadow',
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
