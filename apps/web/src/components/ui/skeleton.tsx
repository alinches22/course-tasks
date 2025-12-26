'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'default' && 'rounded-lg',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1">
          <Skeleton variant="text" className="w-1/3 mb-2" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
      <Skeleton className="h-32 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  );
}

export function BattleCardSkeleton() {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" className="w-24" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-8 h-8" />
          <Skeleton variant="text" className="w-24" />
        </div>
        <Skeleton variant="text" className="w-8" />
        <div className="flex items-center gap-2">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
