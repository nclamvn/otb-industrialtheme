'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-6: useMobileGestures Hook — Touch Gesture Detection
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  deltaX: number;
  deltaY: number;
  velocity: number;
  duration: number;
}

export interface PinchEvent {
  scale: number;
  centerX: number;
  centerY: number;
}

export interface LongPressEvent {
  clientX: number;
  clientY: number;
  target: EventTarget | null;
}

interface UseMobileGesturesOptions {
  onSwipe?: (event: SwipeEvent) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (event: PinchEvent) => void;
  onLongPress?: (event: LongPressEvent) => void;
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;
  longPressDelay?: number;
  enabled?: boolean;
}

export function useMobileGestures({
  onSwipe,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onLongPress,
  swipeThreshold = 50,
  swipeVelocityThreshold = 0.3,
  longPressDelay = 500,
  enabled = true,
}: UseMobileGesturesOptions = {}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      setIsSwiping(true);
      setSwipeOffset({ x: 0, y: 0 });

      if (onLongPress && e.touches.length === 1) {
        clearLongPress();
        longPressTimerRef.current = setTimeout(() => {
          onLongPress({ clientX: touch.clientX, clientY: touch.clientY, target: e.target });
        }, longPressDelay);
      }

      if (e.touches.length === 2) {
        clearLongPress();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistRef.current = Math.hypot(dx, dy);
      }
    },
    [enabled, onLongPress, longPressDelay, clearLongPress]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      setSwipeOffset({ x: dx, y: dy });

      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) clearLongPress();

      if (e.touches.length === 2 && initialPinchDistRef.current && onPinch) {
        const pinchDx = e.touches[0].clientX - e.touches[1].clientX;
        const pinchDy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(pinchDx, pinchDy);
        const scale = currentDist / initialPinchDistRef.current;
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        onPinch({ scale, centerX, centerY });
      }
    },
    [enabled, onPinch, clearLongPress]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;
      clearLongPress();
      setIsSwiping(false);

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;
      const velocity = Math.hypot(dx, dy) / duration;

      if (Math.abs(dx) >= swipeThreshold || Math.abs(dy) >= swipeThreshold) {
        if (velocity >= swipeVelocityThreshold) {
          const isHorizontal = Math.abs(dx) > Math.abs(dy);
          const direction: SwipeEvent['direction'] = isHorizontal
            ? dx > 0 ? 'right' : 'left'
            : dy > 0 ? 'down' : 'up';

          const event: SwipeEvent = { direction, deltaX: dx, deltaY: dy, velocity, duration };
          onSwipe?.(event);

          switch (direction) {
            case 'left': onSwipeLeft?.(); break;
            case 'right': onSwipeRight?.(); break;
            case 'up': onSwipeUp?.(); break;
            case 'down': onSwipeDown?.(); break;
          }
        }
      }

      setSwipeOffset({ x: 0, y: 0 });
      touchStartRef.current = null;
      initialPinchDistRef.current = null;
    },
    [enabled, clearLongPress, swipeThreshold, swipeVelocityThreshold, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !enabled) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      clearLongPress();
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, clearLongPress]);

  return { ref: elementRef, isSwiping, swipeOffset };
}
