'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useSmartScrollState({ threshold = 10, hideOffset = 100 } = {}) {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isFilterBarVisible, setIsFilterBarVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const diff = currentY - lastScrollY.current;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
      setScrollDirection('down');
      if (currentY > hideOffset) {
        setIsFilterBarVisible(false);
      }
    } else {
      setScrollDirection('up');
      setIsFilterBarVisible(true);
    }

    lastScrollY.current = currentY;
  }, [threshold, hideOffset]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { scrollDirection, isFilterBarVisible };
}
