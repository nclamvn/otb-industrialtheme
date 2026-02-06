import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store = new Map<string, RateLimitStore>();

  // Default: 20 requests per minute
  private readonly limit = parseInt(process.env.AI_RATE_LIMIT || '20', 10);
  private readonly windowMs = parseInt(process.env.AI_RATE_WINDOW_MS || '60000', 10);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);

    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (record.count >= this.limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        {
          message: 'Too many requests. Please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }

  private getKey(request: any): string {
    // Use user ID if authenticated, otherwise IP
    const userId = request.user?.id;
    if (userId) return `user:${userId}`;

    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    return `ip:${ip}`;
  }
}
