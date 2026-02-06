// lib/performance/monitoring.ts
// Performance monitoring and tracking utilities

/* eslint-disable @typescript-eslint/no-explicit-any */

// =====================================================
// TYPES
// =====================================================

interface PerformanceMetric {
  type: 'api' | 'render' | 'query' | 'ai';
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface APIMetric extends PerformanceMetric {
  type: 'api';
  endpoint: string;
  method: string;
  status: number;
  cacheHit: boolean;
}

interface QueryMetric extends PerformanceMetric {
  type: 'query';
  query: string;
  rowCount?: number;
}

// =====================================================
// METRIC COLLECTOR
// =====================================================

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private slowThresholds = {
    api: 1000,    // 1 second
    render: 100,  // 100ms
    query: 500,   // 500ms
    ai: 5000,     // 5 seconds
  };

  /**
   * Track an API call
   */
  trackAPI(
    endpoint: string,
    method: string,
    startTime: number,
    status: number,
    cacheHit: boolean = false
  ): void {
    const duration = Date.now() - startTime;
    
    const metric: APIMetric = {
      type: 'api',
      name: `${method} ${endpoint}`,
      endpoint,
      method,
      duration,
      status,
      cacheHit,
      timestamp: new Date().toISOString(),
    };

    this.addMetric(metric);
    this.checkSlow('api', duration, metric.name);
  }

  /**
   * Track a database query
   */
  trackQuery(
    queryName: string,
    startTime: number,
    rowCount?: number
  ): void {
    const duration = Date.now() - startTime;
    
    const metric: QueryMetric = {
      type: 'query',
      name: queryName,
      query: queryName,
      duration,
      rowCount,
      timestamp: new Date().toISOString(),
    };

    this.addMetric(metric);
    this.checkSlow('query', duration, queryName);
  }

  /**
   * Track a render/component mount
   */
  trackRender(componentName: string, duration: number): void {
    const metric: PerformanceMetric = {
      type: 'render',
      name: componentName,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.addMetric(metric);
    this.checkSlow('render', duration, componentName);
  }

  /**
   * Track AI operation
   */
  trackAI(operation: string, startTime: number, metadata?: Record<string, any>): void {
    const duration = Date.now() - startTime;
    
    const metric: PerformanceMetric = {
      type: 'ai',
      name: operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.addMetric(metric);
    this.checkSlow('ai', duration, operation);
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log in production
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ perf: metric }));
    }
  }

  /**
   * Check if operation is slow and warn
   */
  private checkSlow(type: keyof typeof this.slowThresholds, duration: number, name: string): void {
    if (duration > this.slowThresholds[type]) {
      console.warn(`⚠️ Slow ${type}: ${name} took ${duration}ms (threshold: ${this.slowThresholds[type]}ms)`);
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    byType: Record<string, number>;
    avgDuration: Record<string, number>;
    slowest: PerformanceMetric[];
  } {
    const byType: Record<string, number> = {};
    const totalDuration: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const metric of this.metrics) {
      byType[metric.type] = (byType[metric.type] || 0) + 1;
      totalDuration[metric.type] = (totalDuration[metric.type] || 0) + metric.duration;
      counts[metric.type] = (counts[metric.type] || 0) + 1;
    }

    const avgDuration: Record<string, number> = {};
    for (const type of Object.keys(totalDuration)) {
      avgDuration[type] = Math.round(totalDuration[type] / counts[type]);
    }

    // Get slowest operations
    const slowest = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalMetrics: this.metrics.length,
      byType,
      avgDuration,
      slowest,
    };
  }

  /**
   * Get recent metrics
   */
  getRecent(count: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// =====================================================
// TIMING UTILITIES
// =====================================================

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  type: 'api' | 'query' | 'ai' = 'api'
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    
    switch (type) {
      case 'query':
        perfMonitor.trackQuery(name, start);
        break;
      case 'ai':
        perfMonitor.trackAI(name, start);
        break;
      default:
        perfMonitor.trackAPI(name, 'INTERNAL', start, 200);
    }
    
    return result;
  } catch (error) {
    perfMonitor.trackAPI(name, 'INTERNAL', start, 500);
    throw error;
  }
}

/**
 * Create a timer for manual measurements
 */
export function createTimer() {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
    end: (name: string, type: 'api' | 'query' | 'ai' = 'api') => {
      const duration = Date.now() - start;
      switch (type) {
        case 'query':
          perfMonitor.trackQuery(name, start);
          break;
        case 'ai':
          perfMonitor.trackAI(name, start);
          break;
        default:
          perfMonitor.trackAPI(name, 'INTERNAL', start, 200);
      }
      return duration;
    },
  };
}

// =====================================================
// REACT HOOK FOR RENDER TIMING
// =====================================================

export function useRenderTiming(componentName: string) {
  if (typeof window === 'undefined') return;
  
  const start = performance.now();
  
  // Use requestIdleCallback to measure after paint
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      const duration = performance.now() - start;
      perfMonitor.trackRender(componentName, Math.round(duration));
    });
  }
}

// =====================================================
// WEB VITALS
// =====================================================

export function reportWebVitals(metric: any) {
  // Report to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value}`);
  }
  
  // Could send to analytics service
  // sendToAnalytics(metric);
}
