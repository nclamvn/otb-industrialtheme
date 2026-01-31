/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals and sends to analytics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
// Note: FID (First Input Delay) has been deprecated and replaced by INP (Interaction to Next Paint)

// ============================================
// TYPES
// ============================================

interface VitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  page: string;
  timestamp: number;
}

// ============================================
// THRESHOLDS (from Google)
// ============================================

export const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  FID: { good: 100, poor: 300 },        // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte
  INP: { good: 200, poor: 500 },        // Interaction to Next Paint
} as const;

// ============================================
// RATING HELPER
// ============================================

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS];
  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// ============================================
// SEND TO ANALYTICS
// ============================================

const vitalsEndpoint = '/api/analytics/vitals';
const metricsQueue: VitalsMetric[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

function queueMetric(metric: VitalsMetric) {
  metricsQueue.push(metric);

  // Debounce flush to batch multiple metrics
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }

  flushTimeout = setTimeout(flushMetrics, 2000);
}

function flushMetrics() {
  if (metricsQueue.length === 0) return;

  const metrics = [...metricsQueue];
  metricsQueue.length = 0;

  const body = JSON.stringify({ metrics });

  // Use sendBeacon for reliability (works even on page unload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(vitalsEndpoint, body);
  } else {
    fetch(vitalsEndpoint, {
      body,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Silently fail - don't affect user experience
    });
  }
}

function sendToAnalytics(metric: Metric) {
  const vitalsMetric: VitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    page: typeof window !== 'undefined' ? window.location.pathname : '/',
    timestamp: Date.now(),
  };

  // Queue for batched sending
  queueMetric(vitalsMetric);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[Vital] ${metric.name}: ${metric.value.toFixed(2)} (${vitalsMetric.rating})`
    );
  }
}

// ============================================
// REPORT WEB VITALS
// ============================================

/**
 * Start reporting Web Vitals
 * Call this in your app's entry point
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  onCLS(sendToAnalytics);
  onLCP(sendToAnalytics);
  // onFID has been deprecated, using onINP instead
  onINP(sendToAnalytics);
  onINP(sendToAnalytics);

  // Other Web Vitals
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  // Flush metrics when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
    }
  });

  // Flush metrics before page unload
  window.addEventListener('beforeunload', flushMetrics);
}

// ============================================
// PERFORMANCE OBSERVER
// ============================================

/**
 * Track long tasks (tasks > 50ms)
 */
export function trackLongTasks(callback: (entry: PerformanceEntry) => void) {
  if (typeof window === 'undefined') return;
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => observer.disconnect();
  } catch {
    // PerformanceObserver not supported
    return undefined;
  }
}

/**
 * Track layout shifts
 */
export function trackLayoutShifts(
  callback: (entry: PerformanceEntry & { value: number }) => void
) {
  if (typeof window === 'undefined') return;
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((entry as any).hadRecentInput) continue;
        callback(entry as PerformanceEntry & { value: number });
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    return () => observer.disconnect();
  } catch {
    return undefined;
  }
}

// ============================================
// PERFORMANCE METRICS HELPER
// ============================================

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  domInteractive: number;
  memoryUsage?: number;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined') return null;
  if (!('performance' in window)) return null;

  const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!timing) return null;

  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
  const fpEntry = paintEntries.find((e) => e.name === 'first-paint');

  // Memory usage (Chrome only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory = (performance as any).memory;

  return {
    loadTime: timing.loadEventEnd - timing.startTime,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.startTime,
    domInteractive: timing.domInteractive - timing.startTime,
    firstPaint: fpEntry?.startTime || 0,
    firstContentfulPaint: fcpEntry?.startTime || 0,
    memoryUsage: memory?.usedJSHeapSize / 1024 / 1024, // MB
  };
}
