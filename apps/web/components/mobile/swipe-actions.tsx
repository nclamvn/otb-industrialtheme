'use client';

import { useState, useRef, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Check, X } from 'lucide-react';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: 'primary' | 'destructive' | 'success' | 'warning';
  onClick: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
}

const colorClasses = {
  primary: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
};

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className,
}: SwipeActionsProps) {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const _containerRef = useRef<HTMLDivElement>(null);

  const actionWidth = 72;
  const maxLeftOffset = leftActions.length * actionWidth;
  const maxRightOffset = rightActions.length * actionWidth;

  const handleSwipe = useCallback(
    (deltaX: number) => {
      if (isAnimating) return;

      let newOffset = deltaX;

      // Limit the offset
      if (newOffset > 0) {
        newOffset = Math.min(newOffset, maxLeftOffset);
      } else {
        newOffset = Math.max(newOffset, -maxRightOffset);
      }

      // Add resistance when exceeding limits
      if (newOffset > maxLeftOffset * 0.8) {
        const excess = newOffset - maxLeftOffset * 0.8;
        newOffset = maxLeftOffset * 0.8 + excess * 0.2;
      } else if (newOffset < -maxRightOffset * 0.8) {
        const excess = -maxRightOffset * 0.8 - newOffset;
        newOffset = -maxRightOffset * 0.8 - excess * 0.2;
      }

      setOffset(newOffset);
    },
    [isAnimating, maxLeftOffset, maxRightOffset]
  );

  const handleSwipeEnd = useCallback(() => {
    setIsAnimating(true);

    // Snap to actions or back to center
    if (offset > threshold && leftActions.length > 0) {
      setOffset(maxLeftOffset);
    } else if (offset < -threshold && rightActions.length > 0) {
      setOffset(-maxRightOffset);
    } else {
      setOffset(0);
    }

    setTimeout(() => setIsAnimating(false), 200);
  }, [offset, threshold, leftActions.length, rightActions.length, maxLeftOffset, maxRightOffset]);

  const handlers = useSwipeable({
    onSwiping: (e) => handleSwipe(e.deltaX),
    onSwiped: handleSwipeEnd,
    trackMouse: false,
    trackTouch: true,
    delta: 10,
  });

  const closeActions = useCallback(() => {
    setIsAnimating(true);
    setOffset(0);
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    closeActions();
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      {...handlers}
    >
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex flex-col items-center justify-center w-[72px] text-xs font-medium',
                colorClasses[action.color]
              )}
              style={{
                transform: `translateX(${Math.min(0, offset - (leftActions.length - index) * actionWidth)}px)`,
              }}
            >
              {action.icon}
              <span className="mt-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex flex-col items-center justify-center w-[72px] text-xs font-medium',
                colorClasses[action.color]
              )}
              style={{
                transform: `translateX(${Math.max(0, offset + (index + 1) * actionWidth)}px)`,
              }}
            >
              {action.icon}
              <span className="mt-1">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative bg-background',
          isAnimating && 'transition-transform duration-200'
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

// Preset action configurations
export const presetActions = {
  edit: (onClick: () => void): SwipeAction => ({
    icon: <Edit className="h-5 w-5" />,
    label: 'Edit',
    color: 'primary',
    onClick,
  }),
  delete: (onClick: () => void): SwipeAction => ({
    icon: <Trash2 className="h-5 w-5" />,
    label: 'Delete',
    color: 'destructive',
    onClick,
  }),
  approve: (onClick: () => void): SwipeAction => ({
    icon: <Check className="h-5 w-5" />,
    label: 'Approve',
    color: 'success',
    onClick,
  }),
  reject: (onClick: () => void): SwipeAction => ({
    icon: <X className="h-5 w-5" />,
    label: 'Reject',
    color: 'destructive',
    onClick,
  }),
};
