'use client';

import { useRef, useEffect, useCallback } from 'react';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection, distance: number) => void;
}

interface SwipeOptions {
  threshold?: number; // Min distance to trigger swipe (default: 50)
  velocity?: number; // Min velocity to trigger swipe (default: 0.3)
  preventScroll?: boolean; // Prevent vertical scroll on horizontal swipe
}

// ════════════════════════════════════════
// Hook
// ════════════════════════════════════════

export function useSwipeGesture<T extends HTMLElement = HTMLDivElement>(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, velocity = 0.3, preventScroll = false } = options;
  const ref = useRef<T>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;
      const deltaTime = Date.now() - startTime.current;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const velocityX = absX / deltaTime;
      const velocityY = absY / deltaTime;

      // Horizontal swipe
      if (absX > absY && absX > threshold && velocityX > velocity) {
        const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left';
        handlers.onSwipe?.(direction, absX);
        if (direction === 'left') handlers.onSwipeLeft?.();
        if (direction === 'right') handlers.onSwipeRight?.();
      }

      // Vertical swipe
      if (absY > absX && absY > threshold && velocityY > velocity) {
        const direction: SwipeDirection = deltaY > 0 ? 'down' : 'up';
        handlers.onSwipe?.(direction, absY);
        if (direction === 'up') handlers.onSwipeUp?.();
        if (direction === 'down') handlers.onSwipeDown?.();
      }
    },
    [handlers, threshold, velocity]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (preventScroll) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - startX.current);
        const deltaY = Math.abs(touch.clientY - startY.current);

        // Prevent scroll if horizontal movement is greater
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
        }
      }
    },
    [preventScroll]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, {
      passive: !preventScroll,
    });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchStart, handleTouchEnd, handleTouchMove, preventScroll]);

  return ref;
}

export type { SwipeDirection, SwipeHandlers, SwipeOptions };
