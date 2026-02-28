'use client';
import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/useMobile';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children, threshold = 80 }) {
  const containerRef = useRef(null);
  const { isPulling, pullDistance, isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePullToRefresh({ onRefresh, threshold });

  const progress = Math.min(pullDistance / threshold, 1);
  const showSpinner = pullDistance >= threshold || isRefreshing;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex justify-center items-center overflow-hidden z-10"
        style={{ top: -60 }}
        animate={{ y: isPulling || isRefreshing ? pullDistance : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(196,151,90,0.1)' }}
        >
          {showSpinner ? (
            <Loader2 size={18} className="animate-spin" style={{ color: '#C4975A' }} />
          ) : (
            <motion.div
              style={{ rotate: progress * 360 }}
              className="w-4 h-4 rounded-full border-2 border-t-transparent"
              initial={false}
              animate={{ borderColor: `rgba(196,151,90,${progress})` }}
            />
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ y: isPulling || isRefreshing ? pullDistance * 0.5 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
