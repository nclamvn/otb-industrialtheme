/**
 * Request Batching Utilities
 *
 * Batches multiple requests into a single API call to reduce network overhead.
 */

// ============================================
// REQUEST BATCHER CLASS
// ============================================

type BatchedRequest<T> = {
  key: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

interface BatcherOptions {
  batchSize?: number;
  delay?: number;
}

export class RequestBatcher<T> {
  private queue: BatchedRequest<T>[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly delay: number;
  private readonly batchFn: (keys: string[]) => Promise<Map<string, T>>;

  constructor(
    batchFn: (keys: string[]) => Promise<Map<string, T>>,
    options: BatcherOptions = {}
  ) {
    this.batchFn = batchFn;
    this.batchSize = options.batchSize || 50;
    this.delay = options.delay || 10;
  }

  async load(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      this.scheduleBatch();
    });
  }

  loadMany(keys: string[]): Promise<T[]> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  private scheduleBatch() {
    if (this.timeout) return;

    if (this.queue.length >= this.batchSize) {
      this.executeBatch();
      return;
    }

    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.executeBatch();
    }, this.delay);
  }

  private async executeBatch() {
    const batch = this.queue.splice(0, this.batchSize);
    if (batch.length === 0) return;

    const keys = batch.map((r) => r.key);
    const uniqueKeys = Array.from(new Set(keys));

    try {
      const results = await this.batchFn(uniqueKeys);

      batch.forEach((request) => {
        const result = results.get(request.key);
        if (result !== undefined) {
          request.resolve(result);
        } else {
          request.reject(new Error(`No result for key: ${request.key}`));
        }
      });
    } catch (error) {
      batch.forEach((request) => {
        request.reject(error as Error);
      });
    }
  }

  clear() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.queue = [];
  }
}

// ============================================
// PRE-CONFIGURED BATCHERS
// ============================================

// SKU Batcher - batch multiple SKU lookups
export const skuBatcher = new RequestBatcher<unknown>(
  async (skuIds) => {
    const response = await fetch('/api/v1/skus/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: skuIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch fetch SKUs: ${response.status}`);
    }

    const data = await response.json();
    return new Map(data.map((item: { id: string }) => [item.id, item]));
  },
  { batchSize: 100, delay: 10 }
);

// Store Batcher - batch multiple store lookups
export const storeBatcher = new RequestBatcher<unknown>(
  async (storeIds) => {
    const response = await fetch('/api/v1/stores/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: storeIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch fetch stores: ${response.status}`);
    }

    const data = await response.json();
    return new Map(data.map((item: { id: string }) => [item.id, item]));
  },
  { batchSize: 50, delay: 10 }
);

// Brand Batcher - batch multiple brand lookups
export const brandBatcher = new RequestBatcher<unknown>(
  async (brandIds) => {
    const response = await fetch('/api/v1/brands/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: brandIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch fetch brands: ${response.status}`);
    }

    const data = await response.json();
    return new Map(data.map((item: { id: string }) => [item.id, item]));
  },
  { batchSize: 30, delay: 10 }
);

// ============================================
// SWR-STYLE CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
}

interface SWRCacheOptions {
  staleTime?: number;
  maxEntries?: number;
}

export class SWRCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private pending: Map<string, Promise<T>> = new Map();
  private readonly staleTime: number;
  private readonly maxEntries: number;

  constructor(options: SWRCacheOptions = {}) {
    this.staleTime = options.staleTime || 5 * 60 * 1000; // 5 minutes default
    this.maxEntries = options.maxEntries || 1000;
  }

  async get(
    key: string,
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean; staleTime?: number }
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    const staleTime = options?.staleTime || this.staleTime;

    // Return fresh cache immediately
    if (cached && now < cached.staleAt && !options?.forceRefresh) {
      return cached.data;
    }

    // Check if already fetching
    const pending = this.pending.get(key);
    if (pending) {
      return pending;
    }

    // Start fetching
    const fetchPromise = (async () => {
      try {
        const data = await fetcher();
        this.set(key, data, staleTime);
        return data;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, fetchPromise);

    // If we have stale data, return it immediately while revalidating
    if (cached) {
      fetchPromise.catch(() => {}); // Prevent unhandled rejection
      return cached.data;
    }

    return fetchPromise;
  }

  set(key: string, data: T, staleTime?: number) {
    // Evict old entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      staleAt: now + (staleTime || this.staleTime),
    });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string | RegExp) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysArray = Array.from(this.cache.keys());
    for (const key of keysArray) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      pendingRequests: this.pending.size,
    };
  }
}

// ============================================
// PRE-CONFIGURED SWR CACHES
// ============================================

export const apiCache = new SWRCache({ staleTime: 5 * 60 * 1000 }); // 5 minutes
export const masterDataCache = new SWRCache({ staleTime: 60 * 60 * 1000 }); // 1 hour
export const analyticsCache = new SWRCache({ staleTime: 2 * 60 * 1000 }); // 2 minutes

// ============================================
// OPTIMISTIC UPDATE HELPER
// ============================================

import { QueryClient } from '@tanstack/react-query';

export async function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
): Promise<() => void> {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey });

  // Snapshot previous value
  const previousData = queryClient.getQueryData<T>(queryKey);

  // Optimistically update
  queryClient.setQueryData<T>(queryKey, updater);

  // Return rollback function
  return () => queryClient.setQueryData(queryKey, previousData);
}
