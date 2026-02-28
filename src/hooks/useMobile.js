'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─── useSwipe ────────────────────────────────────────────────────────────────
export function useSwipe(ref, { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = {}) {
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startPos.current.x;
      const dy = e.changedTouches[0].clientY - startPos.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy && absDx > threshold) {
        dx > 0 ? onSwipeRight?.() : onSwipeLeft?.();
      } else if (absDy > absDx && absDy > threshold) {
        dy > 0 ? onSwipeDown?.() : onSwipeUp?.();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
}

// ─── useBottomSheet ──────────────────────────────────────────────────────────
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [snapPoint, setSnapPoint] = useState('half');

  const open = useCallback((snap = 'half') => {
    setSnapPoint(snap);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, snapPoint, open, close, setSnapPoint };
}

// ─── useScrollLock ───────────────────────────────────────────────────────────
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}

// ─── usePullToRefresh ────────────────────────────────────────────────────────
export function usePullToRefresh({ onRefresh, threshold = 80 } = {}) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.5, 150));
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    setIsPulling(false);
    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  return { isPulling, pullDistance, isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd };
}

// ─── useHaptic ───────────────────────────────────────────────────────────────
export function useHaptic() {
  const vibrate = useCallback((pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const light = useCallback(() => vibrate(10), [vibrate]);
  const medium = useCallback(() => vibrate(20), [vibrate]);
  const heavy = useCallback(() => vibrate([30, 10, 30]), [vibrate]);

  return { vibrate, light, medium, heavy };
}

// ─── Re-export useIsMobile ───────────────────────────────────────────────────
export { useIsMobile } from './useIsMobile';
