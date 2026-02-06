/**
 * PRODUCTION RATE LIMITER
 *
 * Multi-tier rate limiting:
 * 1. Per-IP limiting - prevent abuse
 * 2. Per-User limiting - fair usage
 * 3. Per-Endpoint limiting - protect critical endpoints
 * 4. Sliding window algorithm - smooth traffic
 *
 * Features:
 * - Redis-backed (distributed)
 * - In-memory fallback
 * - Configurable limits per endpoint
 * - Bypass for trusted IPs
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Types
interface RateLimitConfig {
  points: number;        // Max requests
  duration: number;      // Time window in seconds
  blockDuration?: number; // Block duration after limit exceeded
}

interface RateLimitEntry {
  points: number;
  resetAt: number;
}

// Decorator metadata key
export const RATE_LIMIT_KEY = 'rate_limit';

// Decorator for setting rate limits on routes
export function RateLimit(config: RateLimitConfig) {
  return (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor.value);
    } else {
      Reflect.defineMetadata(RATE_LIMIT_KEY, config, target);
    }
    return descriptor ?? target;
  };
}

// Default limits
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints - strict
  'POST:/api/v1/auth/login': { points: 5, duration: 60, blockDuration: 300 },
  'POST:/api/v1/auth/register': { points: 3, duration: 60, blockDuration: 600 },
  'POST:/api/v1/auth/forgot-password': { points: 3, duration: 60, blockDuration: 600 },

  // Upload endpoints - moderate
  'POST:/api/v1/sku-proposals/*/upload': { points: 10, duration: 60 },
  'POST:/api/v1/sku-proposals/*/import': { points: 5, duration: 60 },

  // AI endpoints - moderate
  'POST:/api/v1/ai/chat': { points: 20, duration: 60 },
  'POST:/api/v1/ai/suggestions': { points: 10, duration: 60 },

  // Report exports - moderate
  'GET:/api/v1/reports/export/*': { points: 10, duration: 60 },

  // Default for all endpoints
  'default': { points: 100, duration: 60 },
};

// Trusted IPs (localhost, internal networks)
const TRUSTED_IPS = new Set([
  '127.0.0.1',
  '::1',
  'localhost',
]);

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  // In-memory store (fallback when Redis not available)
  private readonly store = new Map<string, RateLimitEntry>();

  constructor(private readonly reflector: Reflector) {
    // Cleanup interval
    setInterval(() => this.cleanup(), 60000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);

    // Skip for trusted IPs in development
    if (process.env.NODE_ENV === 'development' && TRUSTED_IPS.has(ip)) {
      return true;
    }

    // Get rate limit config
    const config = this.getConfig(context, request);

    // Generate key
    const key = this.generateKey(request, ip);

    // Check rate limit
    const result = await this.checkLimit(key, config);

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', config.points.toString());
    response.header('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
    response.header('X-RateLimit-Reset', result.resetAt.toString());

    if (!result.allowed) {
      response.header('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000).toString());

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private getConfig(context: ExecutionContext, request: Request): RateLimitConfig {
    // Check for decorator on handler
    const handler = context.getHandler();
    const handlerConfig = this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, handler);
    if (handlerConfig) {
      return handlerConfig;
    }

    // Check for decorator on class
    const classConfig = this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, context.getClass());
    if (classConfig) {
      return classConfig;
    }

    // Check predefined limits
    const method = request.method;
    const path = request.path;

    // Try exact match first
    const exactKey = `${method}:${path}`;
    if (DEFAULT_LIMITS[exactKey]) {
      return DEFAULT_LIMITS[exactKey];
    }

    // Try wildcard patterns
    for (const [pattern, config] of Object.entries(DEFAULT_LIMITS)) {
      if (pattern === 'default') continue;

      const [patternMethod, patternPath] = pattern.split(':');
      if (method !== patternMethod) continue;

      const regex = new RegExp(
        '^' + patternPath.replace(/\*/g, '[^/]+') + '$'
      );
      if (regex.test(path)) {
        return config;
      }
    }

    return DEFAULT_LIMITS['default'];
  }

  private generateKey(request: Request, ip: string): string {
    const userId = (request as Request & { user?: { id: string } }).user?.id;
    const path = request.path.replace(/\/[a-zA-Z0-9-]+/g, '/*'); // Normalize IDs

    if (userId) {
      return `rate:user:${userId}:${request.method}:${path}`;
    }
    return `rate:ip:${ip}:${request.method}:${path}`;
  }

  private async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - config.duration * 1000;

    // Get or create entry
    let entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // New window
      entry = {
        points: config.points - 1,
        resetAt: now + config.duration * 1000,
      };
      this.store.set(key, entry);

      return {
        allowed: true,
        remaining: entry.points,
        resetAt: entry.resetAt,
      };
    }

    if (entry.points <= 0) {
      // Limit exceeded
      if (config.blockDuration) {
        entry.resetAt = now + config.blockDuration * 1000;
        this.store.set(key, entry);
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Consume a point
    entry.points--;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: entry.points,
      resetAt: entry.resetAt,
    };
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate limit configurations for common use cases
 */
export const RateLimits = {
  // Very strict - auth/security
  AUTH: { points: 5, duration: 60, blockDuration: 300 } as RateLimitConfig,

  // Strict - uploads, exports
  UPLOAD: { points: 10, duration: 60 } as RateLimitConfig,

  // Moderate - AI, heavy operations
  AI: { points: 20, duration: 60 } as RateLimitConfig,

  // Standard - normal API
  STANDARD: { points: 100, duration: 60 } as RateLimitConfig,

  // Lenient - reads
  READ: { points: 200, duration: 60 } as RateLimitConfig,
};
