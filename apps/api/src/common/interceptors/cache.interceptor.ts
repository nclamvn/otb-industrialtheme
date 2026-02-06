import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService, CacheTTL } from '../cache/cache.service';

// Metadata keys
export const CACHE_KEY = 'cache:key';
export const CACHE_TTL = 'cache:ttl';
export const CACHE_INVALIDATE = 'cache:invalidate';

// Decorators

/**
 * Cache the response of this endpoint
 * @param keyPrefix - Cache key prefix (will be combined with request params)
 * @param ttlSeconds - Time to live in seconds
 */
export const Cacheable = (keyPrefix: string, ttlSeconds: number = CacheTTL.MEDIUM) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, keyPrefix)(target, key, descriptor);
    SetMetadata(CACHE_TTL, ttlSeconds)(target, key, descriptor);
    return descriptor;
  };
};

/**
 * Invalidate cache entries matching the pattern after method execution
 * @param patterns - Array of cache key patterns to invalidate
 */
export const CacheInvalidate = (...patterns: string[]) => {
  return SetMetadata(CACHE_INVALIDATE, patterns);
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Get cache metadata
    const cacheKeyPrefix = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL, context.getHandler());
    const invalidatePatterns = this.reflector.get<string[]>(CACHE_INVALIDATE, context.getHandler());

    // Skip caching for non-GET requests (unless explicitly decorated)
    if (method !== 'GET' && !cacheKeyPrefix) {
      // Handle cache invalidation for mutating requests
      if (invalidatePatterns && invalidatePatterns.length > 0) {
        return next.handle().pipe(
          tap(async () => {
            for (const pattern of invalidatePatterns) {
              const resolvedPattern = this.resolvePattern(pattern, request);
              await this.cacheService.deleteByPattern(resolvedPattern);
            }
          }),
        );
      }
      return next.handle();
    }

    // Build cache key
    if (!cacheKeyPrefix) {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(cacheKeyPrefix, request);

    // Try to get from cache
    const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse !== null) {
      return of(cachedResponse);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (response) => {
        if (response !== undefined && response !== null) {
          await this.cacheService.set(cacheKey, response, { ttl: cacheTTL || CacheTTL.MEDIUM });
        }
      }),
    );
  }

  private buildCacheKey(prefix: string, request: any): string {
    const parts = [prefix];

    // Add query params
    if (request.query && Object.keys(request.query).length > 0) {
      const sortedParams = Object.keys(request.query)
        .sort()
        .map((key) => `${key}=${request.query[key]}`)
        .join('&');
      parts.push(`q:${sortedParams}`);
    }

    // Add route params
    if (request.params && Object.keys(request.params).length > 0) {
      const sortedParams = Object.keys(request.params)
        .sort()
        .map((key) => `${key}=${request.params[key]}`)
        .join('&');
      parts.push(`p:${sortedParams}`);
    }

    // Add user ID if authenticated
    if (request.user?.id) {
      parts.push(`u:${request.user.id}`);
    }

    return parts.join(':');
  }

  private resolvePattern(pattern: string, request: any): string {
    // Replace placeholders like :id with actual values
    let resolved = pattern;

    if (request.params) {
      for (const [key, value] of Object.entries(request.params)) {
        resolved = resolved.replace(`:${key}`, String(value));
      }
    }

    if (request.body) {
      for (const [key, value] of Object.entries(request.body)) {
        if (typeof value === 'string' || typeof value === 'number') {
          resolved = resolved.replace(`:${key}`, String(value));
        }
      }
    }

    return resolved;
  }
}

/**
 * Cache key builder helpers for common patterns
 */
export const CacheKeyBuilders = {
  // List endpoints with filters
  list: (entity: string, filters: Record<string, any>) => {
    const filterStr = Object.keys(filters)
      .filter((k) => filters[k] !== undefined)
      .sort()
      .map((k) => `${k}:${filters[k]}`)
      .join(':');
    return `${entity}:list:${filterStr || 'all'}`;
  },

  // Single entity by ID
  entity: (entity: string, id: string) => `${entity}:${id}`,

  // Paginated results
  paginated: (entity: string, page: number, limit: number, filters?: Record<string, any>) => {
    const filterStr = filters
      ? Object.keys(filters)
          .filter((k) => filters[k] !== undefined)
          .sort()
          .map((k) => `${k}:${filters[k]}`)
          .join(':')
      : '';
    return `${entity}:page:${page}:limit:${limit}${filterStr ? `:${filterStr}` : ''}`;
  },

  // Cursor-based pagination
  cursor: (entity: string, cursor: string | null, limit: number, filters?: Record<string, any>) => {
    const filterStr = filters
      ? Object.keys(filters)
          .filter((k) => filters[k] !== undefined)
          .sort()
          .map((k) => `${k}:${filters[k]}`)
          .join(':')
      : '';
    return `${entity}:cursor:${cursor || 'start'}:limit:${limit}${filterStr ? `:${filterStr}` : ''}`;
  },

  // User-specific cache
  userScoped: (entity: string, userId: string, suffix?: string) =>
    `user:${userId}:${entity}${suffix ? `:${suffix}` : ''}`,
};
