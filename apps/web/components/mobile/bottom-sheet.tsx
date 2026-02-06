'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  defaultSnapPoint = 0,
  className,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const _sheetRef = useRef<HTMLDivElement>(null);

  const currentHeight = snapPoints[currentSnap] * 100;

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
  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === 'Down') {
        setIsDragging(true);
        setDragOffset(Math.max(0, e.deltaY));
      } else if (e.dir === 'Up' && currentSnap < snapPoints.length - 1) {
        setIsDragging(true);
        setDragOffset(Math.min(0, e.deltaY));
      }
    },
    onSwipedDown: (e) => {
      setIsDragging(false);
      setDragOffset(0);

      const threshold = window.innerHeight * 0.1;
      if (e.deltaY > threshold) {
        if (currentSnap > 0) {
          setCurrentSnap(currentSnap - 1);
        } else {
          onClose();
        }
      }
    },
    onSwipedUp: (e) => {
      setIsDragging(false);
      setDragOffset(0);

      const threshold = window.innerHeight * 0.1;
      if (e.deltaY < -threshold && currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      }
    },
    onTouchEndOrOnMouseUp: () => {
      setIsDragging(false);
      setDragOffset(0);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 10,
  });

  // Reset snap point when opening
  useEffect(() => {
    if (open) {
      setCurrentSnap(defaultSnapPoint);
    }
  }, [open, defaultSnapPoint]);

  const calculateTransform = useCallback(() => {
    if (!open) {
      return 'translateY(100%)';
    }
    const baseOffset = 100 - currentHeight;
    const dragPercent = (dragOffset / window.innerHeight) * 100;
    return `translateY(${baseOffset + dragPercent}%)`;
  }, [open, currentHeight, dragOffset]);

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

      {/* Sheet */}
      <div
        {...handlers}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl border-2 border-border',
          !isDragging && 'transition-transform duration-300 ease-out',
          className
        )}
        style={{
          height: '90vh',
          transform: calculateTransform(),
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
