'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ════════════════════════════════════════
// DAFC Gold Shimmer Skeleton
// ════════════════════════════════════════

interface DAFCSkeletonProps {
  className?: string;
  variant?: 'default' | 'gold' | 'dark';
}

export function DAFCSkeleton({ className, variant = 'gold' }: DAFCSkeletonProps) {
  const variantStyles = {
    default: 'bg-muted',
    gold: 'bg-gradient-to-r from-[#B8860B]/10 via-[#D7B797]/20 to-[#B8860B]/10',
    dark: 'bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800',
  };

  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        variantStyles[variant],
        variant !== 'default' && 'animate-shimmer bg-[length:200%_100%]',
        className
      )}
    />
  );
}

// ════════════════════════════════════════
// Pre-built Skeleton Components
// ════════════════════════════════════════

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border p-4 space-y-3', className)}>
      <DAFCSkeleton className="h-40 w-full rounded-lg" />
      <DAFCSkeleton className="h-4 w-3/4" />
      <DAFCSkeleton className="h-3 w-1/2" />
      <div className="flex justify-between">
        <DAFCSkeleton className="h-4 w-20" />
        <DAFCSkeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <DAFCSkeleton
          key={i}
          className={cn('h-4', i === 0 ? 'w-8' : i === columns - 1 ? 'w-8' : 'flex-1')}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <DAFCSkeleton
            key={i}
            className={cn('h-4', i === 0 ? 'w-8' : i === columns - 1 ? 'w-8' : 'flex-1')}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

export function SkeletonSummaryCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-xl border border-border p-4 border-l-4',
            [
              'border-l-blue-500',
              'border-l-purple-500',
              'border-l-[#127749]',
              'border-l-[#B8860B]',
            ][i % 4]
          )}
        >
          <DAFCSkeleton className="h-3 w-20 mb-2" />
          <DAFCSkeleton className="h-8 w-24 mb-1" />
          <DAFCSkeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <DAFCSkeleton className="h-4 w-24" />
          <DAFCSkeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 mt-6">
        <DAFCSkeleton className="h-10 w-24" />
        <DAFCSkeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export default DAFCSkeleton;
