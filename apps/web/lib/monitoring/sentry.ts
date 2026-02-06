// Sentry configuration and utilities
// Note: Full Sentry setup requires @sentry/nextjs package and configuration files

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

// Get Sentry configuration based on environment
export function getSentryConfig(): SentryConfig | null {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured');
    return null;
  }

  return {
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  };
}

// User context for Sentry
export interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

// Set user context
export function setSentryUser(user: SentryUser | null): void {
  // This would use Sentry.setUser(user) when Sentry is initialized
  if (typeof window !== 'undefined') {
    (window as unknown as { __sentryUser?: SentryUser | null }).__sentryUser = user;
  }
}

// Add breadcrumb
export function addBreadcrumb(
  category: string,
  message: string,
  _level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  // This would use Sentry.addBreadcrumb when Sentry is initialized
  console.log(`[Breadcrumb] ${category}: ${message}`, data);
}

// Capture exception
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  // This would use Sentry.captureException when Sentry is initialized
  console.error('[Sentry] Exception:', error, context);
}

// Capture message
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  // This would use Sentry.captureMessage when Sentry is initialized
  console.log(`[Sentry] ${level}: ${message}`, context);
}

// Set tag
export function setTag(key: string, value: string): void {
  // This would use Sentry.setTag when Sentry is initialized
  console.log(`[Sentry] Tag: ${key}=${value}`);
}

// Set extra context
export function setExtra(key: string, value: unknown): void {
  // This would use Sentry.setExtra when Sentry is initialized
  console.log(`[Sentry] Extra: ${key}`, value);
}

// Wrap function with error capture
export function withSentry<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args);

      // Handle promises
      if (result instanceof Promise) {
        return result.catch((error) => {
          captureException(error, context);
          throw error;
        });
      }

      return result;
    } catch (error) {
      captureException(error, context);
      throw error;
    }
  }) as T;
}
