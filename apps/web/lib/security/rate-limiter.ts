import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Rate limit configurations
export const RATE_LIMITS = {
  // API endpoints - general
  api: {
    points: 100,           // 100 requests
    duration: 60,          // per 1 minute
    blockDuration: 60,     // Block for 1 minute
  },
  // Authentication endpoints
  auth: {
    points: 5,             // 5 attempts
    duration: 15 * 60,     // per 15 minutes
    blockDuration: 15 * 60, // Block for 15 minutes
  },
  // AI endpoints (expensive operations)
  ai: {
    points: 10,            // 10 requests
    duration: 60,          // per 1 minute
    blockDuration: 60,     // Block for 1 minute
  },
  // File uploads
  upload: {
    points: 20,            // 20 uploads
    duration: 60 * 60,     // per 1 hour
    blockDuration: 60 * 60, // Block for 1 hour
  },
};

// Create rate limiters
const rateLimiters = {
  api: new RateLimiterMemory(RATE_LIMITS.api),
  auth: new RateLimiterMemory(RATE_LIMITS.auth),
  ai: new RateLimiterMemory(RATE_LIMITS.ai),
  upload: new RateLimiterMemory(RATE_LIMITS.upload),
};

export type RateLimitType = keyof typeof rateLimiters;

// Get client IP from request
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}

// Check rate limit
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<{ success: boolean; remaining: number; reset: number } | null> {
  const limiter = rateLimiters[type];
  const ip = getClientIP(request);
  const key = `${type}:${ip}`;

  try {
    const result = await limiter.consume(key);
    return {
      success: true,
      remaining: result.remainingPoints,
      reset: Math.ceil(result.msBeforeNext / 1000),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    // Rate limit exceeded
    const rateLimitError = error as { remainingPoints: number; msBeforeNext: number };
    return {
      success: false,
      remaining: 0,
      reset: Math.ceil(rateLimitError.msBeforeNext / 1000),
    };
  }
}

// Rate limit middleware for API routes
export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, type);

  if (!result) {
    return null;
  }

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.reset,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.reset),
          'X-RateLimit-Limit': String(RATE_LIMITS[type].points),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    );
  }

  return null;
}

// Rate limit response headers
export function rateLimitHeaders(
  type: RateLimitType,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMITS[type].points),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };
}
