/**
 * PRODUCTION CACHING SERVICE
 *
 * Multi-layer caching strategy:
 * 1. L1: In-memory LRU cache (fast, limited size)
 * 2. L2: Redis cache (distributed, larger capacity)
 *
 * Features:
 * - Automatic TTL management
 * - Cache invalidation patterns
 * - Batch operations
 * - Cache warming
 * - Statistics tracking
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

// Types
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  sets: number;
  deletes: number;
}

interface CacheOptions {
  ttl?: number;          // Time-to-live in seconds
  l1Only?: boolean;      // Skip L2 cache
  compress?: boolean;    // Compress large values
}

// Default configuration
const DEFAULT_L1_MAX_SIZE = 1000;
const DEFAULT_TTL = 300; // 5 minutes
const COMPRESSION_THRESHOLD = 1024; // 1KB

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  // L1: In-memory LRU cache
  private l1Cache: Map<string, CacheEntry<unknown>> = new Map();
  private l1MaxSize: number = DEFAULT_L1_MAX_SIZE;

  // L2: Redis client
  private redis: RedisClientType | null = null;
  private redisConnected = false;

  // Stats
  private stats: CacheStats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    sets: 0,
    deletes: 0,
  };

  async onModuleInit() {
    // Initialize Redis if URL is provided
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = createClient({ url: redisUrl });
        this.redis.on('error', (err) => this.logger.error('Redis error:', err));
        this.redis.on('connect', () => {
          this.redisConnected = true;
          this.logger.log('Redis connected');
        });
        this.redis.on('disconnect', () => {
          this.redisConnected = false;
          this.logger.warn('Redis disconnected');
        });
        await this.redis.connect();
      } catch (error) {
        this.logger.warn('Redis not available, using L1 cache only', error);
        this.redis = null;
      }
    } else {
      this.logger.log('Redis URL not configured, using L1 cache only');
    }

    // Start cleanup interval
    setInterval(() => this.cleanupL1(), 60000); // Every minute
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Get value from cache (L1 → L2)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try L1 first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      l1Entry.hits++;
      this.stats.l1Hits++;
      return l1Entry.value as T;
    }

    // L1 miss
    this.stats.l1Misses++;

    // Try L2 (Redis)
    if (this.redis && this.redisConnected) {
      try {
        const value = await this.redis.get(this.prefixKey(key));
        if (value) {
          this.stats.l2Hits++;
          const parsed = JSON.parse(value) as T;
          // Populate L1
          this.setL1(key, parsed, DEFAULT_TTL);
          return parsed;
        }
        this.stats.l2Misses++;
      } catch (error) {
        this.logger.error(`Redis get error for ${key}:`, error);
      }
    }

    return null;
  }

  /**
   * Set value in cache (L1 + L2)
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? DEFAULT_TTL;

    // Set in L1
    this.setL1(key, value, ttl);

    // Set in L2 (Redis) if not L1-only
    if (!options.l1Only && this.redis && this.redisConnected) {
      try {
        const serialized = JSON.stringify(value);
        await this.redis.setEx(this.prefixKey(key), ttl, serialized);
      } catch (error) {
        this.logger.error(`Redis set error for ${key}:`, error);
      }
    }

    this.stats.sets++;
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    this.l1Cache.delete(key);

    if (this.redis && this.redisConnected) {
      try {
        await this.redis.del(this.prefixKey(key));
      } catch (error) {
        this.logger.error(`Redis delete error for ${key}:`, error);
      }
    }

    this.stats.deletes++;
  }

  /**
   * Delete by pattern (e.g., "user:*")
   */
  async deleteByPattern(pattern: string): Promise<number> {
    let deleted = 0;

    // Delete from L1
    for (const key of this.l1Cache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.l1Cache.delete(key);
        deleted++;
      }
    }

    // Delete from L2
    if (this.redis && this.redisConnected) {
      try {
        const keys = await this.redis.keys(this.prefixKey(pattern));
        if (keys.length > 0) {
          await this.redis.del(keys);
          deleted += keys.length;
        }
      } catch (error) {
        this.logger.error(`Redis deleteByPattern error for ${pattern}:`, error);
      }
    }

    return deleted;
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Batch get
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const missingKeys: string[] = [];

    // Check L1
    for (const key of keys) {
      const l1Entry = this.l1Cache.get(key);
      if (l1Entry && l1Entry.expiresAt > Date.now()) {
        result.set(key, l1Entry.value as T);
        l1Entry.hits++;
      } else {
        missingKeys.push(key);
      }
    }

    // Check L2 for missing keys
    if (missingKeys.length > 0 && this.redis && this.redisConnected) {
      try {
        const prefixedKeys = missingKeys.map((k) => this.prefixKey(k));
        const values = await this.redis.mGet(prefixedKeys);

        for (let i = 0; i < missingKeys.length; i++) {
          if (values[i]) {
            const parsed = JSON.parse(values[i]!) as T;
            result.set(missingKeys[i], parsed);
            this.setL1(missingKeys[i], parsed, DEFAULT_TTL);
          }
        }
      } catch (error) {
        this.logger.error('Redis mget error:', error);
      }
    }

    return result;
  }

  /**
   * Batch set
   */
  async mset<T>(entries: Map<string, T>, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? DEFAULT_TTL;

    // Set in L1
    for (const [key, value] of entries) {
      this.setL1(key, value, ttl);
    }

    // Set in L2
    if (!options.l1Only && this.redis && this.redisConnected) {
      try {
        const pipeline = this.redis.multi();
        for (const [key, value] of entries) {
          pipeline.setEx(this.prefixKey(key), ttl, JSON.stringify(value));
        }
        await pipeline.exec();
      } catch (error) {
        this.logger.error('Redis mset error:', error);
      }
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();

    if (this.redis && this.redisConnected) {
      try {
        const keys = await this.redis.keys(this.prefixKey('*'));
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } catch (error) {
        this.logger.error('Redis clear error:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { l1Size: number; hitRate: number } {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    const totalMisses = this.stats.l1Misses + this.stats.l2Misses;
    const hitRate = totalHits + totalMisses > 0
      ? totalHits / (totalHits + totalMisses)
      : 0;

    return {
      ...this.stats,
      l1Size: this.l1Cache.size,
      hitRate,
    };
  }

  // Private helpers

  private setL1<T>(key: string, value: T, ttlSeconds: number): void {
    // Evict if at capacity (LRU-style)
    if (this.l1Cache.size >= this.l1MaxSize) {
      const oldestKey = this.l1Cache.keys().next().value;
      if (oldestKey) {
        this.l1Cache.delete(oldestKey);
      }
    }

    this.l1Cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      hits: 0,
    });
  }

  private cleanupL1(): void {
    const now = Date.now();
    for (const [key, entry] of this.l1Cache) {
      if (entry.expiresAt <= now) {
        this.l1Cache.delete(key);
      }
    }
  }

  private prefixKey(key: string): string {
    return `dafc:${key}`;
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(key);
  }
}

// Cache key builders
export const CacheKeys = {
  // SKU related
  skuProposal: (id: string) => `sku:proposal:${id}`,
  skuItems: (proposalId: string, page: number) => `sku:items:${proposalId}:p${page}`,
  skuItemsCount: (proposalId: string) => `sku:items:count:${proposalId}`,
  skuValidation: (proposalId: string) => `sku:validation:${proposalId}`,

  // OTB related
  otbPlan: (id: string) => `otb:plan:${id}`,
  otbLineItems: (planId: string) => `otb:items:${planId}`,
  otbSummary: (planId: string) => `otb:summary:${planId}`,

  // Budget related
  budget: (id: string) => `budget:${id}`,
  budgetList: (seasonId: string, brandId: string) => `budget:list:${seasonId}:${brandId}`,

  // Analytics
  kpiDashboard: (userId: string) => `kpi:dashboard:${userId}`,
  analytics: (type: string, params: string) => `analytics:${type}:${params}`,

  // Master data (longer TTL)
  brands: () => 'master:brands',
  categories: () => 'master:categories',
  seasons: () => 'master:seasons',
  locations: () => 'master:locations',

  // User related
  userProfile: (id: string) => `user:profile:${id}`,
  userPermissions: (id: string) => `user:permissions:${id}`,

  // Workflow
  pendingApprovals: (userId: string) => `workflow:pending:${userId}`,
};

// TTL presets
export const CacheTTL = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  MASTER_DATA: 86400, // 24 hours
};
