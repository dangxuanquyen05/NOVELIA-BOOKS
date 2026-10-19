import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface SectionHeadingProps {
  overline?: string;
  title: string;
  subtitle?: string;
  linkText?: string;
  linkTo?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  overline,
  title,
  subtitle,
  linkText,
  linkTo,
  align = 'left',
  className = '',
}) => {
  const isCentered = align === 'center';

  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 ${
        isCentered ? 'text-center md:items-center' : ''
      } ${className}`}
    >
      <div className={`space-y-1.5 ${isCentered ? 'mx-auto' : 'max-w-2xl'}`}>
        {overline && (
          <div className="flex items-center gap-2">
            <span className="w-6 h-[1.5px] bg-[#D4AF7A]" />
            <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-[#8C5D3B]">
              {overline}
            </span>
          </div>
        )}

        <h2 className="font-serif-title text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C1917] tracking-tight">
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs sm:text-sm text-[#6E6862] leading-relaxed font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {linkText && linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8C5D3B] hover:text-[#754C2F] group transition shrink-0"
        >
          <span>{linkText}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
};
