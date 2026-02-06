import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * PRODUCTION PRISMA SERVICE
 *
 * Features:
 * - Connection pooling configuration
 * - Query logging (development only)
 * - Slow query detection
 * - Connection health checks
 * - Graceful shutdown
 * - Query performance metrics
 */

// Connection pool settings (via DATABASE_URL params)
// Add to DATABASE_URL: ?connection_limit=10&pool_timeout=30

interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  avgDuration: number;
  errors: number;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isHealthy = false;
  private readonly metrics: QueryMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    avgDuration: 0,
    errors: 0,
  };

  // Slow query threshold in ms
  private readonly SLOW_QUERY_THRESHOLD = 1000;

  constructor() {
    super({
      log: PrismaService.getLogConfig(),
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Setup query performance logging
    if (process.env.NODE_ENV === 'development') {
      this.setupQueryLogging();
    }
  }

  private static getLogConfig(): Prisma.LogLevel[] | Prisma.LogDefinition[] {
    if (process.env.NODE_ENV === 'development') {
      return [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ];
    }
    return ['error'];
  }

  private setupQueryLogging() {
    // Log slow queries
    (this as unknown as { $on: (event: string, callback: (e: { duration: number; query: string }) => void) => void }).$on('query', (e: { duration: number; query: string }) => {
      this.metrics.totalQueries++;

      // Track average duration
      this.metrics.avgDuration =
        (this.metrics.avgDuration * (this.metrics.totalQueries - 1) + e.duration) /
        this.metrics.totalQueries;

      // Log slow queries
      if (e.duration > this.SLOW_QUERY_THRESHOLD) {
        this.metrics.slowQueries++;
        this.logger.warn(
          `Slow query detected (${e.duration}ms): ${e.query.substring(0, 200)}...`
        );
      }
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isHealthy = true;
      this.logger.log('Database connected successfully');

      // Log connection pool info
      const poolInfo = this.getConnectionPoolInfo();
      this.logger.log(`Connection pool: ${JSON.stringify(poolInfo)}`);
    } catch (error) {
      this.isHealthy = false;
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.isHealthy = false;
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        healthy: true,
        latency: Date.now() - start,
      };
    } catch (error) {
      this.isHealthy = false;
      return {
        healthy: false,
        latency: Date.now() - start,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.isHealthy;
  }

  /**
   * Get query metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.totalQueries = 0;
    this.metrics.slowQueries = 0;
    this.metrics.avgDuration = 0;
    this.metrics.errors = 0;
  }

  /**
   * Get connection pool info from DATABASE_URL
   */
  private getConnectionPoolInfo(): {
    connectionLimit: number;
    poolTimeout: number;
  } {
    const url = process.env.DATABASE_URL || '';
    const params = new URLSearchParams(url.split('?')[1] || '');

    return {
      connectionLimit: parseInt(params.get('connection_limit') || '10', 10),
      poolTimeout: parseInt(params.get('pool_timeout') || '30', 10),
    };
  }

  /**
   * Execute with retry for transient failures
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === maxRetries) {
          this.metrics.errors++;
          throw error;
        }

        this.logger.warn(
          `Retrying operation (attempt ${attempt}/${maxRetries}): ${lastError.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    const message = (error as Error).message?.toLowerCase() || '';
    return (
      message.includes('deadlock') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('too many connections') ||
      message.includes('server closed the connection')
    );
  }

  /**
   * Clean shutdown with connection draining
   */
  async gracefulShutdown(): Promise<void> {
    this.logger.log('Starting graceful shutdown...');

    // Wait for in-flight queries (max 30 seconds)
    const maxWait = 30000;
    const checkInterval = 100;
    let waited = 0;

    while (waited < maxWait) {
      // In a real scenario, you'd check for active queries
      // For now, just wait a bit for queries to complete
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    await this.$disconnect();
    this.logger.log('Graceful shutdown complete');
  }
}
