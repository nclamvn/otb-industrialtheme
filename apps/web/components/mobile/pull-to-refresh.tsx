'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isAtTop = useRef(true);

  // Check if scroll is at top
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isAtTop.current = container.scrollTop === 0;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;
    startY.current = e.touches[0].clientY;
  }, [disabled, state]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing' || !isAtTop.current) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance
      const distance = Math.min(diff * 0.5, threshold * 1.5);
      setPullDistance(distance);
      setState(distance >= threshold ? 'ready' : 'pulling');
    }
  }, [disabled, state, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || state === 'idle') return;

    if (state === 'ready') {
      setState('refreshing');
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setState('idle');
        setPullDistance(0);
      }
    } else {
      setState('idle');
      setPullDistance(0);
    }
  }, [disabled, state, threshold, onRefresh]);

  const getIndicatorContent = () => {
    switch (state) {
      case 'pulling':
        return (
          <>
            <ArrowDown
              className={cn(
                'h-5 w-5 transition-transform',
                pullDistance > threshold * 0.5 && 'rotate-180'
              )}
            />
            <span>Pull to refresh</span>
          </>
        );
      case 'ready':
        return (
          <>
            <ArrowDown className="h-5 w-5 rotate-180" />
            <span>Release to refresh</span>
          </>
        );
      case 'refreshing':
        return (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Refreshing...</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-opacity',
          state === 'idle' ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          height: `${pullDistance}px`,
          minHeight: state !== 'idle' ? 40 : 0,
        }}
      >
        {getIndicatorContent()}
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className={cn(
          'h-full overflow-y-auto transition-transform duration-200',
          state === 'refreshing' && 'duration-300'
        )}
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
