'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const paddingClasses = {
  none: '',
  sm: 'px-2 sm:px-4',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-4 sm:px-8 lg:px-12',
};

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function ResponsiveContainer({
  children,
  className,
  padding = 'md',
  maxWidth = 'full',
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        paddingClasses[padding],
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive grid that adapts columns based on screen size
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const getColClass = () => {
    const classes: string[] = [];
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    return classes.join(' ');
  };

  return (
    <div className={cn('grid', getColClass(), gapClasses[gap], className)}>
      {children}
    </div>
  );
}

// Show/hide content based on breakpoint
interface ResponsiveShowProps {
  children: React.ReactNode;
  above?: 'sm' | 'md' | 'lg' | 'xl';
  below?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveShow({
  children,
  above,
  below,
  className,
}: ResponsiveShowProps) {
  const showClasses = {
    sm: { above: 'hidden sm:block', below: 'sm:hidden' },
    md: { above: 'hidden md:block', below: 'md:hidden' },
    lg: { above: 'hidden lg:block', below: 'lg:hidden' },
    xl: { above: 'hidden xl:block', below: 'xl:hidden' },
  };

  let visibilityClass = '';
  if (above) visibilityClass = showClasses[above].above;
  if (below) visibilityClass = showClasses[below].below;

  return (
    <div className={cn(visibilityClass, className)}>
      {children}
    </div>
  );
}

// Hook to detect screen size
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  React.useEffect(() => {
    const getBreakpoint = () => {
      if (typeof window === 'undefined') return 'md';
      const width = window.innerWidth;
      if (width < 640) return 'xs';
      if (width < 768) return 'sm';
      if (width < 1024) return 'md';
      if (width < 1280) return 'lg';
      if (width < 1536) return 'xl';
      return '2xl';
    };

    const handleResize = () => {
      setBreakpoint(getBreakpoint());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
}

// Hook for responsive value based on breakpoint
export function useResponsiveValue<T>(values: {
  default: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}): T {
  const { breakpoint } = useBreakpoint();

  const getValue = () => {
    switch (breakpoint) {
      case 'xs':
        return values.default;
      case 'sm':
        return values.sm ?? values.default;
      case 'md':
        return values.md ?? values.sm ?? values.default;
      case 'lg':
        return values.lg ?? values.md ?? values.sm ?? values.default;
      case 'xl':
      case '2xl':
        return values.xl ?? values.lg ?? values.md ?? values.sm ?? values.default;
      default:
        return values.default;
    }
  };

  return getValue();
}
