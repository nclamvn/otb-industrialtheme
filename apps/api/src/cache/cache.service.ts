/**
 * Cache Service
 *
 * High-level caching abstraction with TTL support and namespacing
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { redisClient } from './redis';
import { RedisClientType } from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

// Default TTL values in seconds
export const CacheTTL = {
  SHORT: 60,         // 1 minute
  MEDIUM: 300,       // 5 minutes
  LONG: 3600,        // 1 hour
  DAY: 86400,        // 24 hours
  MASTER: 86400,     // Master data - 24 hours
  SESSION: 1800,     // Session data - 30 minutes
} as const;

// Cache key prefixes
export const CacheKeys = {
  // Budget
  budget: {
    detail: (id: string) => `budget:detail:${id}`,
    list: (seasonCode: string) => `budget:list:${seasonCode}`,
    summary: (seasonCode: string) => `budget:summary:${seasonCode}`,
    tree: (id: string) => `budget:tree:${id}`,
    versions: (id: string) => `budget:versions:${id}`,
  },

  // SKU
  sku: {
    detail: (id: string) => `sku:detail:${id}`,
    list: (filters: string) => `sku:list:${filters}`,
    costing: (skuId: string) => `sku:costing:${skuId}`,
    byBrand: (brandId: string) => `sku:brand:${brandId}`,
  },

  // Store
  store: {
    all: () => 'store:all',
    detail: (id: string) => `store:detail:${id}`,
    performance: (storeId: string, year: number, month: number) =>
      `store:perf:${storeId}:${year}:${month}`,
  },

  // Delivery
  delivery: {
    matrix: (seasonCode: string) => `delivery:matrix:${seasonCode}`,
    plan: (planId: string) => `delivery:plan:${planId}`,
    summary: (seasonCode: string) => `delivery:summary:${seasonCode}`,
  },

  // Costing
  costing: {
    detail: (id: string) => `costing:detail:${id}`,
    list: (filters: string) => `costing:list:${filters}`,
    priceRanges: () => 'costing:price-ranges',
  },

  // Master data (longer TTL)
  master: {
    categories: () => 'master:categories',
    brands: () => 'master:brands',
    seasons: () => 'master:seasons',
    sizeProfiles: () => 'master:sizeProfiles',
    divisions: () => 'master:divisions',
    locations: () => 'master:locations',
  },

  // User
  user: {
    profile: (userId: string) => `user:profile:${userId}`,
    permissions: (userId: string) => `user:permissions:${userId}`,
    session: (sessionId: string) => `user:session:${sessionId}`,
  },

  // Analytics
  analytics: {
    dashboard: () => 'analytics:dashboard',
    kpis: (period: string) => `analytics:kpis:${period}`,
  },
} as const;

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: RedisClientType | null = null;
  private readonly defaultTTL = CacheTTL.MEDIUM;
  private readonly prefix: string;

  constructor() {
    this.prefix = process.env.CACHE_PREFIX || 'dafc:';
  }

  async onModuleInit() {
    try {
      this.redis = await redisClient.getClient();
      this.logger.log('Cache service initialized');
    } catch (error) {
      this.logger.warn('Redis not available, caching disabled', (error as Error).message);
    }
  }

  async onModuleDestroy() {
    await redisClient.disconnect();
  }

  private buildKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(this.buildKey(key));
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache get error [${key}]:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!this.redis) return;

    try {
      const ttl = options?.ttl || this.defaultTTL;
      await this.redis.setEx(
        this.buildKey(key),
        ttl,
        JSON.stringify(value)
      );
    } catch (error) {
      this.logger.error(`Cache set error [${key}]:`, error);
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetcher();
    await this.set(key, value, options);

    return value;
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(this.buildKey(key));
    } catch (error) {
      this.logger.error(`Cache delete error [${key}]:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      const keys = await this.redis.keys(this.buildKey(pattern));
      if (keys.length === 0) return 0;

      const deleted = await this.redis.del(keys);
      this.logger.debug(`Deleted ${deleted} keys matching pattern: ${pattern}`);
      return deleted;
    } catch (error) {
      this.logger.error(`Cache delete pattern error [${pattern}]:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.exists(this.buildKey(key));
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache exists error [${key}]:`, error);
      return false;
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.expire(this.buildKey(key), seconds);
    } catch (error) {
      this.logger.error(`Cache expire error [${key}]:`, error);
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.redis) return -2;

    try {
      return await this.redis.ttl(this.buildKey(key));
    } catch (error) {
      this.logger.error(`Cache TTL error [${key}]:`, error);
      return -2;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string, amount = 1): Promise<number> {
    if (!this.redis) return 0;

    try {
      return await this.redis.incrBy(this.buildKey(key), amount);
    } catch (error) {
      this.logger.error(`Cache incr error [${key}]:`, error);
      return 0;
    }
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis || keys.length === 0) return keys.map(() => null);

    try {
      const fullKeys = keys.map((k) => this.buildKey(k));
      const values = await this.redis.mGet(fullKeys);
      return values.map((v) => (v ? JSON.parse(v) as T : null));
    } catch (error) {
      this.logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async mset<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    if (!this.redis || items.length === 0) return;

    try {
      const pipeline = this.redis.multi();

      for (const item of items) {
        const fullKey = this.buildKey(item.key);
        const ttl = item.ttl || this.defaultTTL;
        pipeline.setEx(fullKey, ttl, JSON.stringify(item.value));
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error('Cache mset error:', error);
    }
  }

  /**
   * Wrap a function with caching (memoization)
   */
  memoize<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyGenerator: (...args: TArgs) => string,
    options?: CacheOptions
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), options);
    };
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(this.buildKey('*'));
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      this.logger.warn(`Flushed ${keys.length} cache keys`);
    } catch (error) {
      this.logger.error('Cache flushAll error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage?: string;
  }> {
    if (!this.redis) {
      return { connected: false, keyCount: 0 };
    }

    try {
      const keys = await this.redis.keys(this.buildKey('*'));
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);

      return {
        connected: true,
        keyCount: keys.length,
        memoryUsage: memoryMatch?.[1],
      };
    } catch (error) {
      return { connected: false, keyCount: 0 };
    }
  }
}
