'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

// ════════════════════════════════════════
// Gap Classes
// ════════════════════════════════════════

const GAP_CLASSES = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const { breakpoint } = useResponsive();

  // Determine current column count based on breakpoint
  const getColumnCount = () => {
    switch (breakpoint) {
      case '2xl':
      case 'xl':
        return columns.xl || columns.lg || columns.md || columns.sm || columns.xs || 4;
      case 'lg':
        return columns.lg || columns.md || columns.sm || columns.xs || 4;
      case 'md':
        return columns.md || columns.sm || columns.xs || 3;
      case 'sm':
        return columns.sm || columns.xs || 2;
      default:
        return columns.xs || 1;
    }
  };

  const colCount = getColumnCount();

  return (
    <div
      className={cn('grid', GAP_CLASSES[gap], className)}
      style={{
        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

// ════════════════════════════════════════
// Responsive Stack (Column on mobile, row on desktop)
// ════════════════════════════════════════

interface ResponsiveStackProps {
  children: React.ReactNode;
  reverse?: boolean;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  breakAt?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveStack({
  children,
  reverse = false,
  gap = 'md',
  breakAt = 'md',
  className,
}: ResponsiveStackProps) {
  const breakClasses = {
    sm: reverse ? 'sm:flex-row-reverse' : 'sm:flex-row',
    md: reverse ? 'md:flex-row-reverse' : 'md:flex-row',
    lg: reverse ? 'lg:flex-row-reverse' : 'lg:flex-row',
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        breakClasses[breakAt],
        GAP_CLASSES[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// ════════════════════════════════════════
// Mobile Only / Desktop Only
// ════════════════════════════════════════

interface ResponsiveShowProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOnly({ children, className }: ResponsiveShowProps) {
  return <div className={cn('md:hidden', className)}>{children}</div>;
}

export function DesktopOnly({ children, className }: ResponsiveShowProps) {
  return <div className={cn('hidden md:block', className)}>{children}</div>;
}

export default ResponsiveGrid;
export type { ResponsiveGridProps, ResponsiveStackProps };
