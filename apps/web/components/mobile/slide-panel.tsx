'use client';

import { useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function SlidePanel({
  open,
  onClose,
  side = 'left',
  children,
  title,
  className,
}: SlidePanelProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (side === 'left') onClose();
    },
    onSwipedRight: () => {
      if (side === 'right') onClose();
    },
    onSwipedDown: () => {
      if (side === 'bottom') onClose();
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  const getTransformClass = useCallback(() => {
    if (!open) {
      switch (side) {
        case 'left':
          return '-translate-x-full';
        case 'right':
          return 'translate-x-full';
        case 'bottom':
          return 'translate-y-full';
      }
    }
    return 'translate-x-0 translate-y-0';
  }, [open, side]);

  const getPositionClass = () => {
    switch (side) {
      case 'left':
        return 'inset-y-0 left-0 w-[280px] max-w-[85vw]';
      case 'right':
        return 'inset-y-0 right-0 w-[280px] max-w-[85vw]';
      case 'bottom':
        return 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        {...swipeHandlers}
        className={cn(
          'fixed z-50 bg-background border-2 border-border transition-transform duration-300 ease-out',
          getPositionClass(),
          getTransformClass(),
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'slide-panel-title' : undefined}
      >
        {/* Header */}
        {(title || side === 'bottom') && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            {side === 'bottom' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-muted-foreground/30 rounded-full" />
            )}
            {title && (
              <h2 id="slide-panel-title" className="text-base font-semibold">
                {title}
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-auto"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
