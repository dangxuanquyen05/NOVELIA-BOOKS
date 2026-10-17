import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-xl',
}) => {
  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-[#EAE4DC] ${rounded} ${className}`}
    />
  );
};

export const SkeletonBookCard: React.FC = () => {
  return (
    <div className="flex flex-col bg-white rounded-2xl p-3 border border-[#EBE5DC] space-y-3">
      {/* Cover Skeleton */}
      <Skeleton className="w-full aspect-[3/4] rounded-xl" />

      {/* Meta */}
      <div className="space-y-2 pt-1 px-1">
        <Skeleton className="w-16 h-3 rounded-full" />
        <Skeleton className="w-full h-4 rounded-md" />
        <Skeleton className="w-3/4 h-4 rounded-md" />
        <Skeleton className="w-24 h-3 rounded-md" />
      </div>

      {/* Price & Action */}
      <div className="flex items-center justify-between pt-2 px-1">
        <Skeleton className="w-20 h-5 rounded-md" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
};

export const SkeletonBanner: React.FC = () => {
  return (
    <div className="w-full rounded-3xl bg-[#EAE4DC] p-8 sm:p-14 animate-pulse space-y-4">
      <Skeleton className="w-32 h-6 rounded-full bg-[#DDD6CC]" />
      <Skeleton className="w-2/3 h-12 rounded-xl bg-[#DDD6CC]" />
      <Skeleton className="w-1/2 h-6 rounded-lg bg-[#DDD6CC]" />
      <div className="flex gap-4 pt-4">
        <Skeleton className="w-36 h-11 rounded-full bg-[#DDD6CC]" />
        <Skeleton className="w-36 h-11 rounded-full bg-[#DDD6CC]" />
      </div>
    </div>
  );
};
