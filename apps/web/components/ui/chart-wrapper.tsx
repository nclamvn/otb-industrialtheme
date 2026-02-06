// components/ui/chart-wrapper.tsx
// Wrapper component to prevent chart dimension errors
'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ChartWrapperProps {
  children: React.ReactNode;
  /** Minimum height for chart to render (default: 200) */
  minHeight?: number;
  /** Minimum width for chart to render (default: 200) */
  minWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom loading fallback */
  loadingFallback?: React.ReactNode;
  /** Custom error fallback */
  errorFallback?: React.ReactNode;
  /** Aspect ratio (height = width / aspectRatio) */
  aspectRatio?: number;
  /** Fixed height in pixels */
  height?: number;
}

interface Dimensions {
  width: number;
  height: number;
}

/**
 * ChartWrapper - Ensures charts only render when container has valid dimensions
 * 
 * Solves the common Recharts error:
 * "The width(-1) and height(-1) of chart should be greater than 0"
 * 
 * Usage:
 * ```tsx
 * <ChartWrapper height={400}>
 *   <ResponsiveContainer width="100%" height="100%">
 *     <BarChart data={data}>...</BarChart>
 *   </ResponsiveContainer>
 * </ChartWrapper>
 * ```
 */
export function ChartWrapper({
  children,
  minHeight = 200,
  minWidth = 200,
  className,
  loadingFallback,
  errorFallback,
  aspectRatio,
  height,
}: ChartWrapperProps) {
  const t = useTranslations('chart');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const updateDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newWidth = Math.floor(rect.width);
    const newHeight = Math.floor(rect.height);

    // Only update if dimensions actually changed
    setDimensions(prev => {
      if (prev.width !== newWidth || prev.height !== newHeight) {
        return { width: newWidth, height: newHeight };
      }
      return prev;
    });

    // Mark as ready if dimensions are valid
    setIsReady(newWidth >= minWidth && newHeight >= minHeight);
  }, [minWidth, minHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial measurement (with small delay to ensure DOM is ready)
    const initialTimeout = setTimeout(updateDimensions, 50);

    // ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize updates
      requestAnimationFrame(updateDimensions);
    });
    resizeObserver.observe(container);

    // IntersectionObserver for visibility changes (tabs, modals, etc.)
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Small delay to ensure layout is complete
            requestAnimationFrame(updateDimensions);
          }
        });
      },
      { threshold: 0.1 }
    );
    intersectionObserver.observe(container);

    // Window resize fallback
    const handleResize = () => {
      requestAnimationFrame(updateDimensions);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [updateDimensions]);

  // Calculate container style
  const containerStyle: React.CSSProperties = {
    minHeight: height || minHeight,
    minWidth: minWidth,
  };

  if (height) {
    containerStyle.height = height;
  } else if (aspectRatio && dimensions.width > 0) {
    containerStyle.height = dimensions.width / aspectRatio;
  }

  // Determine what to render
  const canRenderChart = isReady && dimensions.width >= minWidth && dimensions.height >= minHeight;

  // Loading state
  const LoadingState = loadingFallback || (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
      <span className="text-sm text-gray-500">{t('loading')}</span>
    </div>
  );

  // Error state (container too small)
  const ErrorState = errorFallback || (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <span className="text-sm text-gray-500 text-center px-4">
        {t('containerTooSmall')}
        <br />
        <span className="text-xs text-gray-400">
          {t('minimumSize', { minWidth, minHeight, width: dimensions.width, height: dimensions.height })}
        </span>
      </span>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn('w-full relative', className)}
      style={containerStyle}
    >
      {hasError ? (
        ErrorState
      ) : canRenderChart ? (
        <ErrorBoundary onError={() => setHasError(true)} fallback={ErrorState}>
          {children}
        </ErrorBoundary>
      ) : (
        LoadingState
      )}
    </div>
  );
}

// Simple Error Boundary for chart errors
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError?: () => void;
}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error:', error, errorInfo);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default ChartWrapper;

// =====================================================
// PRESET CHART CONTAINERS
// =====================================================

/**
 * Small chart container (300px height)
 */
export function SmallChartWrapper({ children, className, ...props }: Omit<ChartWrapperProps, 'height'>) {
  return (
    <ChartWrapper height={300} className={className} {...props}>
      {children}
    </ChartWrapper>
  );
}

/**
 * Medium chart container (400px height)
 */
export function MediumChartWrapper({ children, className, ...props }: Omit<ChartWrapperProps, 'height'>) {
  return (
    <ChartWrapper height={400} className={className} {...props}>
      {children}
    </ChartWrapper>
  );
}

/**
 * Large chart container (500px height)
 */
export function LargeChartWrapper({ children, className, ...props }: Omit<ChartWrapperProps, 'height'>) {
  return (
    <ChartWrapper height={500} className={className} {...props}>
      {children}
    </ChartWrapper>
  );
}

/**
 * Dashboard card chart container (maintains 16:9 aspect ratio)
 */
export function DashboardChartWrapper({ children, className, ...props }: Omit<ChartWrapperProps, 'aspectRatio'>) {
  return (
    <ChartWrapper aspectRatio={16/9} minHeight={200} className={className} {...props}>
      {children}
    </ChartWrapper>
  );
}
