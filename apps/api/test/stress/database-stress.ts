/**
 * Database Stress Test Suite
 *
 * Tests database performance under load:
 * - Connection pool exhaustion
 * - Concurrent queries
 * - Transaction handling
 * - Query timeout behavior
 * - Lock contention
 *
 * Run: npx ts-node apps/api/test/stress/database-stress.ts
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

interface QueryMetric {
  queryName: string;
  duration: number;
  success: boolean;
  error?: string;
  rowCount?: number;
}

interface DatabaseStressConfig {
  concurrentConnections: number;
  queriesPerConnection: number;
  maxQueryTimeout: number;
}

interface StressTestResult {
  testName: string;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  queriesPerSecond: number;
  connectionPoolExhausted: boolean;
  deadlockDetected: boolean;
}

const DEFAULT_CONFIG: DatabaseStressConfig = {
  concurrentConnections: 20,
  queriesPerConnection: 10,
  maxQueryTimeout: 30000,
};

class DatabaseStressTest {
  private prisma: PrismaClient;
  private metrics: QueryMetric[] = [];

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error'],
    });
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private async executeQuery(
    queryName: string,
    queryFn: () => Promise<any>,
  ): Promise<QueryMetric> {
    const startTime = performance.now();
    let success = false;
    let error: string | undefined;
    let rowCount: number | undefined;

    try {
      const result = await queryFn();
      success = true;
      if (Array.isArray(result)) {
        rowCount = result.length;
      } else if (result?.count !== undefined) {
        rowCount = result.count;
      }
    } catch (e) {
      error = (e as Error).message;
    }

    const duration = performance.now() - startTime;

    return {
      queryName,
      duration,
      success,
      error,
      rowCount,
    };
  }

  private generateReport(testName: string, metrics: QueryMetric[]): StressTestResult {
    const durations = metrics.map((m) => m.duration);
    const successful = metrics.filter((m) => m.success).length;
    const failed = metrics.filter((m) => !m.success).length;

    const connectionPoolErrors = metrics.filter(
      (m) => m.error?.includes('connection') || m.error?.includes('pool'),
    ).length;

    const deadlockErrors = metrics.filter(
      (m) => m.error?.includes('deadlock') || m.error?.includes('lock'),
    ).length;

    const totalDuration = durations.reduce((a, b) => a + b, 0);

    return {
      testName,
      totalQueries: metrics.length,
      successfulQueries: successful,
      failedQueries: failed,
      avgDuration: durations.length > 0 ? totalDuration / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      p95Duration: this.calculatePercentile(durations, 95),
      queriesPerSecond: totalDuration > 0 ? (metrics.length / totalDuration) * 1000 : 0,
      connectionPoolExhausted: connectionPoolErrors > 0,
      deadlockDetected: deadlockErrors > 0,
    };
  }

  private printResult(result: StressTestResult): void {
    console.log('\n' + '─'.repeat(50));
    console.log(`  ${result.testName}`);
    console.log('─'.repeat(50));
    console.log(`Total Queries: ${result.totalQueries}`);
    console.log(`Successful: ${result.successfulQueries}`);
    console.log(`Failed: ${result.failedQueries}`);
    console.log(`Avg Duration: ${result.avgDuration.toFixed(2)}ms`);
    console.log(`Min Duration: ${result.minDuration.toFixed(2)}ms`);
    console.log(`Max Duration: ${result.maxDuration.toFixed(2)}ms`);
    console.log(`P95 Duration: ${result.p95Duration.toFixed(2)}ms`);
    console.log(`Queries/sec: ${result.queriesPerSecond.toFixed(2)}`);
    console.log(`Connection Pool Exhausted: ${result.connectionPoolExhausted ? '⚠️ YES' : '✅ NO'}`);
    console.log(`Deadlock Detected: ${result.deadlockDetected ? '⚠️ YES' : '✅ NO'}`);
    console.log('─'.repeat(50));
  }

  /**
   * Test 1: Simple read operations under load
   */
  async testSimpleReads(config: DatabaseStressConfig = DEFAULT_CONFIG): Promise<StressTestResult> {
    console.log('\n📖 Test 1: Simple Read Operations');

    const metrics: QueryMetric[] = [];
    const promises: Promise<void>[] = [];

    for (let conn = 0; conn < config.concurrentConnections; conn++) {
      const promise = (async () => {
        for (let q = 0; q < config.queriesPerConnection; q++) {
          const queries = [
            () => this.prisma.user.findMany({ take: 10 }),
            () => this.prisma.brand.findMany({ take: 10 }),
            () => this.prisma.season.findMany({ take: 10 }),
            () => this.prisma.category.findMany({ take: 10 }),
            () => this.prisma.budgetAllocation.count(),
          ];

          const randomQuery = queries[Math.floor(Math.random() * queries.length)];
          const metric = await this.executeQuery('simple_read', randomQuery);
          metrics.push(metric);
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Simple Read Operations', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 2: Complex join queries
   */
  async testComplexQueries(config: DatabaseStressConfig = DEFAULT_CONFIG): Promise<StressTestResult> {
    console.log('\n🔗 Test 2: Complex Join Queries');

    const metrics: QueryMetric[] = [];
    const promises: Promise<void>[] = [];

    for (let conn = 0; conn < config.concurrentConnections; conn++) {
      const promise = (async () => {
        for (let q = 0; q < config.queriesPerConnection; q++) {
          const metric = await this.executeQuery('complex_query', async () => {
            return this.prisma.budgetAllocation.findMany({
              take: 20,
              include: {
                season: true,
                brand: true,
                createdByUser: {
                  select: { id: true, email: true, fullName: true },
                },
              },
            });
          });
          metrics.push(metric);
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Complex Join Queries', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 3: Aggregation queries
   */
  async testAggregations(config: DatabaseStressConfig = DEFAULT_CONFIG): Promise<StressTestResult> {
    console.log('\n📊 Test 3: Aggregation Queries');

    const metrics: QueryMetric[] = [];
    const promises: Promise<void>[] = [];

    for (let conn = 0; conn < config.concurrentConnections; conn++) {
      const promise = (async () => {
        for (let q = 0; q < config.queriesPerConnection; q++) {
          const queries = [
            () =>
              this.prisma.budgetAllocation.groupBy({
                by: ['status'],
                _count: true,
              }),
            () =>
              this.prisma.budgetAllocation.aggregate({
                _sum: { totalBudget: true },
                _avg: { totalBudget: true },
                _count: true,
              }),
            () =>
              this.prisma.sKUItem.groupBy({
                by: ['category'],
                _count: true,
                _avg: { retailPrice: true },
              }),
          ];

          const randomQuery = queries[Math.floor(Math.random() * queries.length)];
          const metric = await this.executeQuery('aggregation', randomQuery);
          metrics.push(metric);
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Aggregation Queries', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 4: Write operations (create/update)
   */
  async testWriteOperations(config: DatabaseStressConfig = DEFAULT_CONFIG): Promise<StressTestResult> {
    console.log('\n✏️ Test 4: Write Operations');

    const metrics: QueryMetric[] = [];
    const promises: Promise<void>[] = [];

    // Use fewer connections for write tests
    const writeConnections = Math.min(config.concurrentConnections, 10);
    const writesPerConnection = Math.min(config.queriesPerConnection, 5);

    for (let conn = 0; conn < writeConnections; conn++) {
      const promise = (async () => {
        for (let q = 0; q < writesPerConnection; q++) {
          // Create a test record
          const createMetric = await this.executeQuery('create', async () => {
            return this.prisma.notification.create({
              data: {
                title: `Stress Test ${Date.now()}`,
                message: 'Test notification for stress testing',
                type: 'SYSTEM',
                priority: 'LOW',
                userId: '00000000-0000-0000-0000-000000000000', // Placeholder
              },
            });
          });
          metrics.push(createMetric);

          // If create succeeded, update the record
          if (createMetric.success) {
            const updateMetric = await this.executeQuery('update', async () => {
              return this.prisma.notification.updateMany({
                where: { title: { contains: 'Stress Test' } },
                data: { isRead: true },
              });
            });
            metrics.push(updateMetric);
          }
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    // Cleanup
    await this.prisma.notification.deleteMany({
      where: { title: { contains: 'Stress Test' } },
    });

    const result = this.generateReport('Write Operations', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 5: Transaction stress test
   */
  async testTransactions(config: DatabaseStressConfig = DEFAULT_CONFIG): Promise<StressTestResult> {
    console.log('\n🔄 Test 5: Transaction Stress Test');

    const metrics: QueryMetric[] = [];
    const promises: Promise<void>[] = [];

    const txConnections = Math.min(config.concurrentConnections, 10);
    const txPerConnection = Math.min(config.queriesPerConnection, 3);

    for (let conn = 0; conn < txConnections; conn++) {
      const promise = (async () => {
        for (let q = 0; q < txPerConnection; q++) {
          const metric = await this.executeQuery('transaction', async () => {
            return this.prisma.$transaction(async (tx) => {
              // Multiple operations in transaction
              const brands = await tx.brand.findMany({ take: 5 });
              const seasons = await tx.season.findMany({ take: 5 });
              const budgetCount = await tx.budgetAllocation.count();

              return { brands: brands.length, seasons: seasons.length, budgetCount };
            });
          });
          metrics.push(metric);
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Transaction Stress', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 6: Connection pool exhaustion test
   */
  async testConnectionPoolExhaustion(): Promise<StressTestResult> {
    console.log('\n🔌 Test 6: Connection Pool Exhaustion');

    const metrics: QueryMetric[] = [];
    const heavyConnections = 50; // Try to exhaust pool

    const promises = Array.from({ length: heavyConnections }, async (_, i) => {
      const metric = await this.executeQuery(`connection_${i}`, async () => {
        // Long-running query to hold connection
        const result = await this.prisma.budgetAllocation.findMany({
          include: {
            season: true,
            brand: true,
            createdByUser: true,
            approvedByUser: true,
            changeLogs: { take: 5 },
          },
        });

        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 100));

        return result;
      });
      metrics.push(metric);
    });

    await Promise.all(promises);

    const result = this.generateReport('Connection Pool Exhaustion', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 7: Pagination stress test
   */
  async testPagination(config: DatabaseStressConfig = DEFAULT_CONFIG): Promise<StressTestResult> {
    console.log('\n📄 Test 7: Pagination Stress Test');

    const metrics: QueryMetric[] = [];
    const promises: Promise<void>[] = [];

    for (let conn = 0; conn < config.concurrentConnections; conn++) {
      const promise = (async () => {
        for (let page = 0; page < config.queriesPerConnection; page++) {
          const metric = await this.executeQuery(`pagination_page_${page}`, async () => {
            return this.prisma.budgetAllocation.findMany({
              skip: page * 20,
              take: 20,
              orderBy: { createdAt: 'desc' },
              include: {
                brand: true,
                season: true,
              },
            });
          });
          metrics.push(metric);
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Pagination Stress', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Run all tests
   */
  async runAllTests(config: DatabaseStressConfig = DEFAULT_CONFIG): Promise<void> {
    console.log('═'.repeat(60));
    console.log('  DATABASE STRESS TEST SUITE');
    console.log('═'.repeat(60));
    console.log(`\nConfiguration:`);
    console.log(`  Concurrent Connections: ${config.concurrentConnections}`);
    console.log(`  Queries per Connection: ${config.queriesPerConnection}`);
    console.log(`  Query Timeout: ${config.maxQueryTimeout}ms`);

    const results: StressTestResult[] = [];

    try {
      results.push(await this.testSimpleReads(config));
      results.push(await this.testComplexQueries(config));
      results.push(await this.testAggregations(config));
      results.push(await this.testWriteOperations(config));
      results.push(await this.testTransactions(config));
      results.push(await this.testConnectionPoolExhaustion());
      results.push(await this.testPagination(config));

      // Final Summary
      console.log('\n' + '═'.repeat(60));
      console.log('  FINAL SUMMARY');
      console.log('═'.repeat(60));

      let allPassed = true;

      results.forEach((result) => {
        const status =
          result.failedQueries === 0 && !result.connectionPoolExhausted && !result.deadlockDetected
            ? '✅'
            : '❌';

        if (status === '❌') allPassed = false;

        console.log(
          `${status} ${result.testName}: ${result.successfulQueries}/${result.totalQueries} (${result.avgDuration.toFixed(0)}ms avg)`,
        );
      });

      console.log('\n' + '═'.repeat(60));
      console.log(allPassed ? '  ✅ ALL DATABASE STRESS TESTS PASSED' : '  ❌ SOME TESTS FAILED');
      console.log('═'.repeat(60) + '\n');

      process.exit(allPassed ? 0 : 1);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const config: DatabaseStressConfig = {
    concurrentConnections: parseInt(process.env.CONCURRENT_CONNECTIONS || '20'),
    queriesPerConnection: parseInt(process.env.QUERIES_PER_CONNECTION || '10'),
    maxQueryTimeout: parseInt(process.env.QUERY_TIMEOUT || '30000'),
  };

  const test = new DatabaseStressTest();
  test.runAllTests(config).catch((error) => {
    console.error('Database stress test failed:', error);
    process.exit(1);
  });
}

export { DatabaseStressTest, DatabaseStressConfig, StressTestResult };
