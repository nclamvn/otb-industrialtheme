// lib/cache/memory-cache.ts
// High-performance in-memory cache with TTL support

/* eslint-disable @typescript-eslint/no-explicit-any */

type CacheEntry<T> = {
  data: T;
  expiry: number;
  hits: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
      hits: 0,
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Increment hits for LRU tracking
    entry.hits++;
    
    return entry.data as T;
  }

  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidate(pattern: string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate keys by prefix
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by hits (ascending) - least used first
    entries.sort((a, b) => a[1].hits - b[1].hits);
    
    // Remove bottom 10%
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());
      for (const [key, entry] of entries) {
        if (now > entry.expiry) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
const globalCache = new MemoryCache(1000);

export { MemoryCache, globalCache as cache };

// Cache key generators
export const cacheKeys = {
  brands: () => 'brands:all',
  brand: (id: string) => `brands:${id}`,
  
  categories: () => 'categories:all',
  category: (id: string) => `categories:${id}`,
  
  seasons: () => 'seasons:all',
  season: (id: string) => `seasons:${id}`,
  
  budgets: (filters?: Record<string, any>) => 
    `budgets:${filters ? JSON.stringify(filters) : 'all'}`,
  budget: (id: string) => `budgets:${id}`,
  
  otbPlans: (filters?: Record<string, any>) => 
    `otb:${filters ? JSON.stringify(filters) : 'all'}`,
  otbPlan: (id: string) => `otb:${id}`,
  
  skuProposals: (otbId: string) => `sku:otb:${otbId}`,
  skuProposal: (id: string) => `sku:${id}`,
  
  insights: () => 'ai:insights',
  aiQuery: (query: string, context: string) => 
    `ai:query:${hashString(query + context)}`,
};

// Simple string hash for cache keys
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Cache TTL constants (in seconds)
export const cacheTTL = {
  short: 60,        // 1 minute - for frequently changing data
  medium: 300,      // 5 minutes - default
  long: 1800,       // 30 minutes - for stable data
  veryLong: 3600,   // 1 hour - for rarely changing data
};
