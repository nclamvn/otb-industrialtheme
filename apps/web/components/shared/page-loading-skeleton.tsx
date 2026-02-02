'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PageLoadingSkeletonProps {
  type?: 'table' | 'cards' | 'detail' | 'form' | 'dashboard';
  showHeader?: boolean;
  showFilters?: boolean;
  showSummary?: boolean;
  className?: string;
}

/**
 * PageLoadingSkeleton - Full page loading skeleton with different layouts
 */
export function PageLoadingSkeleton({
  type = 'table',
  showHeader = true,
  showFilters = true,
  showSummary = true,
  className,
}: PageLoadingSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header Skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      )}

      {/* Summary Cards Skeleton */}
      {showSummary && type !== 'form' && (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border border-border bg-card p-4 border-l-4',
                ['border-l-blue-500', 'border-l-purple-500', 'border-l-green-500', 'border-l-amber-500'][i]
              )}
            >
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Filters Skeleton */}
      {showFilters && (type === 'table' || type === 'cards') && (
        <div className="flex gap-4">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
          <div className="flex-1" />
          <Skeleton className="h-10 w-64" />
        </div>
      )}

      {/* Content Skeleton based on type */}
      {type === 'table' && <TableSkeleton />}
      {type === 'cards' && <CardGridSkeleton />}
      {type === 'detail' && <DetailSkeleton />}
      {type === 'form' && <FormSkeleton />}
      {type === 'dashboard' && <DashboardSkeleton />}
    </div>
  );
}

/**
 * Table skeleton
 */
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-lg border">
      {/* Table Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/50">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-8" />
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}

      {/* Table Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

/**
 * Card grid skeleton
 */
function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="aspect-[3/4] rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Detail page skeleton
 */
function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Hero Image */}
        <Skeleton className="aspect-[4/3] rounded-lg" />

        {/* Info Section */}
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <TableSkeleton rows={5} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="rounded-lg border p-4 space-y-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Form skeleton
 */
function FormSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Form Sections */}
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-lg border p-4">
          <Skeleton className="h-5 w-28 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Table and Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <div className="rounded-lg border p-4 space-y-4">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { TableSkeleton, CardGridSkeleton, DetailSkeleton, FormSkeleton, DashboardSkeleton };
