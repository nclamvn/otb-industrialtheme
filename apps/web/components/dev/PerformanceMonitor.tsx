'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPerformanceMetrics, VITALS_THRESHOLDS } from '@/lib/web-vitals';

// ============================================
// TYPES
// ============================================

interface PerformanceData {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  fps: number;
}

// ============================================
// PERFORMANCE MONITOR COMPONENT
// ============================================

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceData | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  // Track re-renders
  useEffect(() => {
    setRenderCount((c) => c + 1);
  });

  // Collect metrics
  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    // Initial metrics
    const baseMetrics = getPerformanceMetrics();
    if (baseMetrics) {
      setMetrics({
        loadTime: baseMetrics.loadTime,
        domContentLoaded: baseMetrics.domContentLoaded,
        firstPaint: baseMetrics.firstPaint,
        firstContentfulPaint: baseMetrics.firstContentfulPaint,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        memoryUsage: baseMetrics.memoryUsage || 0,
        fps: 60,
      });
    }

    // Observe LCP
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setMetrics((prev) =>
            prev ? { ...prev, largestContentfulPaint: lastEntry.startTime } : null
          );
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }

    // Observe CLS
    let clsValue = 0;
    let clsObserver: PerformanceObserver | null = null;
    try {
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!(entry as any).hadRecentInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clsValue += (entry as any).value;
            setMetrics((prev) =>
              prev ? { ...prev, cumulativeLayoutShift: clsValue } : null
            );
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
    }

    // Track FPS
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const trackFPS = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;

      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        setMetrics((prev) => (prev ? { ...prev, fps } : null));
        frameCount = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(trackFPS);
    };

    animationId = requestAnimationFrame(trackFPS);

    // Track memory
    const memoryInterval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics((prev) =>
          prev
            ? { ...prev, memoryUsage: memory.usedJSHeapSize / 1024 / 1024 }
            : null
        );
      }
    }, 2000);

    return () => {
      lcpObserver?.disconnect();
      clsObserver?.disconnect();
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
    };
  }, []);

  // Keyboard shortcut to toggle
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P to toggle
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getColor = (name: keyof typeof VITALS_THRESHOLDS, value: number) => {
    const thresholds = VITALS_THRESHOLDS[name];
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.poor) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center text-sm font-mono hover:bg-black transition-colors"
        title="Toggle Performance Monitor (Ctrl+Shift+P)"
      >
        {metrics?.fps || '--'}
      </button>

      {/* Metrics panel */}
      {isVisible && metrics && (
        <div className="fixed bottom-16 right-4 z-[9999] w-72 p-4 bg-black/90 text-white rounded-lg text-xs font-mono shadow-2xl">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/20">
            <h3 className="font-bold text-sm">Performance</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {/* Core Web Vitals */}
            <div className="mb-3">
              <div className="text-white/50 mb-1 text-[10px] uppercase tracking-wider">
                Core Web Vitals
              </div>
              <MetricRow
                label="LCP"
                value={`${metrics.largestContentfulPaint.toFixed(0)}ms`}
                className={getColor('LCP', metrics.largestContentfulPaint)}
              />
              <MetricRow
                label="CLS"
                value={metrics.cumulativeLayoutShift.toFixed(3)}
                className={getColor('CLS', metrics.cumulativeLayoutShift)}
              />
              <MetricRow
                label="FCP"
                value={`${metrics.firstContentfulPaint.toFixed(0)}ms`}
                className={getColor('FCP', metrics.firstContentfulPaint)}
              />
            </div>

            {/* Loading */}
            <div className="mb-3">
              <div className="text-white/50 mb-1 text-[10px] uppercase tracking-wider">
                Loading
              </div>
              <MetricRow
                label="Load Time"
                value={`${metrics.loadTime.toFixed(0)}ms`}
              />
              <MetricRow
                label="DOM Ready"
                value={`${metrics.domContentLoaded.toFixed(0)}ms`}
              />
            </div>

            {/* Runtime */}
            <div>
              <div className="text-white/50 mb-1 text-[10px] uppercase tracking-wider">
                Runtime
              </div>
              <MetricRow
                label="FPS"
                value={metrics.fps.toString()}
                className={metrics.fps >= 55 ? 'text-green-400' : metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}
              />
              <MetricRow
                label="Memory"
                value={`${metrics.memoryUsage.toFixed(1)} MB`}
              />
              <MetricRow
                label="Renders"
                value={renderCount.toString()}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/20 text-[10px] text-white/40">
            Press Ctrl+Shift+P to toggle
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// METRIC ROW COMPONENT
// ============================================

function MetricRow({
  label,
  value,
  className = 'text-white',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-white/70">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}

export default PerformanceMonitor;
