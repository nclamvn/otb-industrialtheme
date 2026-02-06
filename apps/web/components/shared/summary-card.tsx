'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  borderColor?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  tooltip?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * SummaryCard - Reusable metric/summary card with watermark icon
 * Consistent with DAFC OTB design system
 */
export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-500',
  borderColor = 'border-l-blue-500',
  trend,
  tooltip,
  isLoading = false,
  className,
}: SummaryCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-card',
          'border-l-4',
          borderColor,
          className
        )}
      >
        <div className="p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  const cardContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card',
        'hover:border-border/80 transition-all duration-200',
        'border-l-4',
        borderColor,
        className
      )}
    >
      {/* Watermark Icon */}
      {Icon && (
        <div className="absolute -right-4 -bottom-4 pointer-events-none">
          <Icon className={cn('w-24 h-24 opacity-[0.08]', iconColor)} />
        </div>
      )}

      <div className="p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums pr-14">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive === true && 'text-green-600',
                  trend.isPositive === false && 'text-red-600',
                  trend.isPositive === undefined && 'text-muted-foreground'
                )}
              >
                {trend.value > 0 && '+'}
                {trend.value}%
                {trend.label && ` ${trend.label}`}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}

/**
 * SummaryCardGrid - Grid layout for summary cards
 */
interface SummaryCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function SummaryCardGrid({
  children,
  columns = 4,
  className,
}: SummaryCardGridProps) {
  const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {children}
    </div>
  );
}

/**
 * SummaryCardSkeleton - Loading skeleton for summary cards
 */
export function SummaryCardSkeleton({
  count = 4,
  columns = 4,
}: {
  count?: number;
  columns?: 2 | 3 | 4 | 5;
}) {
  return (
    <SummaryCardGrid columns={columns}>
      {Array.from({ length: count }).map((_, i) => (
        <SummaryCard
          key={i}
          title=""
          value=""
          isLoading
          borderColor={
            ['border-l-blue-500', 'border-l-purple-500', 'border-l-green-500', 'border-l-amber-500'][i % 4]
          }
        />
      ))}
    </SummaryCardGrid>
  );
}
