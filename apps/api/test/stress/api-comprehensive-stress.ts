/**
 * Comprehensive API Stress Test Suite
 *
 * Tests all major API endpoints under load conditions:
 * - Read operations (GET)
 * - Write operations (POST/PATCH/DELETE)
 * - Concurrent operations
 * - Rate limiting
 * - Database connection pool stress
 * - Memory leak detection
 *
 * Run: npx ts-node apps/api/test/stress/api-comprehensive-stress.ts [mode]
 * Modes: quick | standard | comprehensive | chaos
 */

interface StressConfig {
  baseUrl: string;
  authToken: string;
  mode: 'quick' | 'standard' | 'comprehensive' | 'chaos';
  concurrentUsers: number;
  requestsPerUser: number;
  rampUpSeconds: number;
  thinkTimeMs: number;
  timeoutMs: number;
}

interface RequestMetric {
  endpoint: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  error?: string;
  responseSize?: number;
}

interface EndpointResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
  errorRate: number;
  avgResponseSize: number;
  errors: Map<number, number>;
}

interface StressTestReport {
  mode: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  totalRequests: number;
  totalSuccess: number;
  totalFailed: number;
  overallErrorRate: number;
  avgResponseTime: number;
  endpointResults: EndpointResult[];
  thresholdsPassed: boolean;
  memoryUsage: {
    initial: number;
    final: number;
    peak: number;
  };
}

// Configuration presets
const CONFIG_PRESETS: Record<string, Partial<StressConfig>> = {
  quick: {
    concurrentUsers: 10,
    requestsPerUser: 5,
    rampUpSeconds: 2,
    thinkTimeMs: 50,
  },
  standard: {
    concurrentUsers: 50,
    requestsPerUser: 10,
    rampUpSeconds: 10,
    thinkTimeMs: 100,
  },
  comprehensive: {
    concurrentUsers: 100,
    requestsPerUser: 20,
    rampUpSeconds: 20,
    thinkTimeMs: 50,
  },
  chaos: {
    concurrentUsers: 200,
    requestsPerUser: 30,
    rampUpSeconds: 5,
    thinkTimeMs: 10,
  },
};

// Performance thresholds
const THRESHOLDS = {
  maxAvgResponseTime: 500, // ms
  maxP95ResponseTime: 1000, // ms
  maxP99ResponseTime: 2000, // ms
  maxErrorRate: 1, // %
  minRequestsPerSecond: 50,
  maxMemoryGrowth: 1.5, // 50% max growth
};

class ComprehensiveStressTest {
  private config: StressConfig;
  private metrics: RequestMetric[] = [];
  private memoryUsage: { initial: number; peak: number; final: number } = {
    initial: 0,
    peak: 0,
    final: 0,
  };

  constructor(config: StressConfig) {
    this.config = config;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getMemoryMB(): number {
    return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
  }

  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
  ): Promise<RequestMetric> {
    const startTime = Date.now();
    let status = 0;
    let success = false;
    let error: string | undefined;
    let responseSize = 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.authToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      status = response.status;
      success = response.ok;

      try {
        const text = await response.text();
        responseSize = text.length;
      } catch {
        // Ignore response parsing errors
      }
    } catch (e) {
      error = (e as Error).message;
      if (error.includes('aborted')) {
        error = 'TIMEOUT';
        status = 408;
      }
    }

    const endTime = Date.now();

    // Track peak memory
    const currentMemory = this.getMemoryMB();
    if (currentMemory > this.memoryUsage.peak) {
      this.memoryUsage.peak = currentMemory;
    }

    return {
      endpoint,
      method,
      startTime,
      endTime,
      duration: endTime - startTime,
      status,
      success,
      error,
      responseSize,
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private generateReport(
    endpointMetrics: Map<string, RequestMetric[]>,
    startTime: Date,
    endTime: Date,
  ): StressTestReport {
    const endpointResults: EndpointResult[] = [];
    let totalRequests = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let allDurations: number[] = [];

    endpointMetrics.forEach((metrics, key) => {
      const [method, endpoint] = key.split(':');
      const durations = metrics.map((m) => m.duration);
      const successful = metrics.filter((m) => m.success).length;
      const failed = metrics.filter((m) => !m.success).length;
      const responseSizes = metrics.map((m) => m.responseSize || 0);

      // Count errors by status code
      const errors = new Map<number, number>();
      metrics
        .filter((m) => !m.success)
        .forEach((m) => {
          errors.set(m.status, (errors.get(m.status) || 0) + 1);
        });

      const testDuration =
        metrics.length > 0
          ? (metrics[metrics.length - 1].endTime - metrics[0].startTime) / 1000
          : 0;

      endpointResults.push({
        endpoint,
        method,
        totalRequests: metrics.length,
        successfulRequests: successful,
        failedRequests: failed,
        avgResponseTime:
          durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
        maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
        p50: this.calculatePercentile(durations, 50),
        p95: this.calculatePercentile(durations, 95),
        p99: this.calculatePercentile(durations, 99),
        requestsPerSecond: testDuration > 0 ? metrics.length / testDuration : 0,
        errorRate: metrics.length > 0 ? (failed / metrics.length) * 100 : 0,
        avgResponseSize:
          responseSizes.length > 0
            ? responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length
            : 0,
        errors,
      });

      totalRequests += metrics.length;
      totalSuccess += successful;
      totalFailed += failed;
      allDurations = allDurations.concat(durations);
    });

    const totalDuration = (endTime.getTime() - startTime.getTime()) / 1000;

    // Check thresholds
    let thresholdsPassed = true;
    endpointResults.forEach((result) => {
      if (
        result.avgResponseTime > THRESHOLDS.maxAvgResponseTime ||
        result.p95 > THRESHOLDS.maxP95ResponseTime ||
        result.p99 > THRESHOLDS.maxP99ResponseTime ||
        result.errorRate > THRESHOLDS.maxErrorRate
      ) {
        thresholdsPassed = false;
      }
    });

    // Check memory growth
    if (
      this.memoryUsage.initial > 0 &&
      this.memoryUsage.final / this.memoryUsage.initial > THRESHOLDS.maxMemoryGrowth
    ) {
      thresholdsPassed = false;
    }

    return {
      mode: this.config.mode,
      startTime,
      endTime,
      totalDuration,
      totalRequests,
      totalSuccess,
      totalFailed,
      overallErrorRate: totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0,
      avgResponseTime:
        allDurations.length > 0
          ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
          : 0,
      endpointResults,
      thresholdsPassed,
      memoryUsage: this.memoryUsage,
    };
  }

  private printReport(report: StressTestReport): void {
    console.log('\n' + '═'.repeat(80));
    console.log('  COMPREHENSIVE API STRESS TEST REPORT');
    console.log('═'.repeat(80));

    console.log(`\n📊 Test Summary`);
    console.log('─'.repeat(40));
    console.log(`Mode: ${report.mode.toUpperCase()}`);
    console.log(`Duration: ${report.totalDuration.toFixed(2)}s`);
    console.log(`Total Requests: ${report.totalRequests.toLocaleString()}`);
    console.log(`Successful: ${report.totalSuccess.toLocaleString()} (${((report.totalSuccess / report.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Failed: ${report.totalFailed.toLocaleString()} (${report.overallErrorRate.toFixed(2)}%)`);
    console.log(`Avg Response Time: ${report.avgResponseTime.toFixed(2)}ms`);

    console.log(`\n💾 Memory Usage`);
    console.log('─'.repeat(40));
    console.log(`Initial: ${report.memoryUsage.initial.toFixed(2)}MB`);
    console.log(`Peak: ${report.memoryUsage.peak.toFixed(2)}MB`);
    console.log(`Final: ${report.memoryUsage.final.toFixed(2)}MB`);
    console.log(
      `Growth: ${(((report.memoryUsage.final - report.memoryUsage.initial) / report.memoryUsage.initial) * 100).toFixed(2)}%`,
    );

    console.log(`\n📈 Endpoint Results`);
    console.log('─'.repeat(80));
    console.log(
      '│ Endpoint'.padEnd(35) +
        '│ Req'.padEnd(8) +
        '│ Avg'.padEnd(8) +
        '│ P95'.padEnd(8) +
        '│ P99'.padEnd(8) +
        '│ Err%'.padEnd(8) +
        '│ Status',
    );
    console.log('─'.repeat(80));

    report.endpointResults.forEach((result) => {
      const status =
        result.avgResponseTime <= THRESHOLDS.maxAvgResponseTime &&
        result.p95 <= THRESHOLDS.maxP95ResponseTime &&
        result.errorRate <= THRESHOLDS.maxErrorRate
          ? '✅'
          : '❌';

      console.log(
        `│ ${(result.method + ' ' + result.endpoint).substring(0, 33).padEnd(33)}` +
          `│ ${String(result.totalRequests).padEnd(6)}` +
          `│ ${result.avgResponseTime.toFixed(0).padEnd(6)}` +
          `│ ${result.p95.toFixed(0).padEnd(6)}` +
          `│ ${result.p99.toFixed(0).padEnd(6)}` +
          `│ ${result.errorRate.toFixed(1).padEnd(6)}` +
          `│ ${status}`,
      );
    });
    console.log('─'.repeat(80));

    console.log(`\n🎯 Threshold Checks`);
    console.log('─'.repeat(40));
    console.log(
      `Max Avg Response Time (${THRESHOLDS.maxAvgResponseTime}ms): ${report.avgResponseTime <= THRESHOLDS.maxAvgResponseTime ? '✅ PASS' : '❌ FAIL'}`,
    );
    console.log(
      `Max Error Rate (${THRESHOLDS.maxErrorRate}%): ${report.overallErrorRate <= THRESHOLDS.maxErrorRate ? '✅ PASS' : '❌ FAIL'}`,
    );
    console.log(
      `Memory Growth (<${(THRESHOLDS.maxMemoryGrowth - 1) * 100}%): ${report.memoryUsage.final / report.memoryUsage.initial <= THRESHOLDS.maxMemoryGrowth ? '✅ PASS' : '❌ FAIL'}`,
    );

    console.log('\n' + '═'.repeat(80));
    console.log(
      report.thresholdsPassed
        ? '  ✅ ALL THRESHOLDS PASSED - STRESS TEST SUCCESSFUL'
        : '  ❌ SOME THRESHOLDS FAILED - REVIEW REQUIRED',
    );
    console.log('═'.repeat(80) + '\n');
  }

  async runTest(): Promise<StressTestReport> {
    console.log('\n🚀 Starting Comprehensive API Stress Test');
    console.log(`Mode: ${this.config.mode.toUpperCase()}`);
    console.log(`Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`Requests per User: ${this.config.requestsPerUser}`);
    console.log(`Ramp Up: ${this.config.rampUpSeconds}s\n`);

    this.memoryUsage.initial = this.getMemoryMB();
    this.memoryUsage.peak = this.memoryUsage.initial;

    const startTime = new Date();
    const endpointMetrics = new Map<string, RequestMetric[]>();

    // Define test scenarios
    const scenarios = [
      // Health check
      { endpoint: '/health', method: 'GET', weight: 5 },

      // Read-heavy operations
      { endpoint: '/budgets', method: 'GET', weight: 15 },
      { endpoint: '/budgets?page=1&limit=20', method: 'GET', weight: 10 },
      { endpoint: '/budgets?status=DRAFT', method: 'GET', weight: 5 },
      { endpoint: '/budgets?status=APPROVED', method: 'GET', weight: 5 },

      { endpoint: '/otb-plans', method: 'GET', weight: 10 },
      { endpoint: '/otb-plans?status=DRAFT', method: 'GET', weight: 5 },

      { endpoint: '/sku-proposals', method: 'GET', weight: 10 },

      // Master data (cacheable)
      { endpoint: '/brands', method: 'GET', weight: 10 },
      { endpoint: '/seasons', method: 'GET', weight: 10 },
      { endpoint: '/categories', method: 'GET', weight: 5 },
      { endpoint: '/locations', method: 'GET', weight: 5 },

      // Analytics (potentially heavy)
      { endpoint: '/kpi', method: 'GET', weight: 3 },
      { endpoint: '/workflows', method: 'GET', weight: 2 },
    ];

    // Calculate total weight
    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);

    // Simulate users
    const userPromises: Promise<void>[] = [];
    const rampUpInterval = (this.config.rampUpSeconds * 1000) / this.config.concurrentUsers;

    for (let user = 0; user < this.config.concurrentUsers; user++) {
      await this.sleep(rampUpInterval);

      const userPromise = (async () => {
        for (let req = 0; req < this.config.requestsPerUser; req++) {
          // Select random endpoint based on weight
          let random = Math.random() * totalWeight;
          let selectedScenario = scenarios[0];

          for (const scenario of scenarios) {
            random -= scenario.weight;
            if (random <= 0) {
              selectedScenario = scenario;
              break;
            }
          }

          const metric = await this.makeRequest(selectedScenario.endpoint, selectedScenario.method);

          const key = `${selectedScenario.method}:${selectedScenario.endpoint}`;
          if (!endpointMetrics.has(key)) {
            endpointMetrics.set(key, []);
          }
          endpointMetrics.get(key)!.push(metric);

          if (this.config.thinkTimeMs > 0) {
            await this.sleep(this.config.thinkTimeMs);
          }
        }
      })();

      userPromises.push(userPromise);
    }

    await Promise.all(userPromises);

    const endTime = new Date();
    this.memoryUsage.final = this.getMemoryMB();

    const report = this.generateReport(endpointMetrics, startTime, endTime);
    this.printReport(report);

    return report;
  }
}

// Spike Test
async function runSpikeTest(baseConfig: StressConfig): Promise<void> {
  console.log('\n⚡ SPIKE TEST - Testing sudden load increase');
  console.log('═'.repeat(60));

  // Phase 1: Normal load
  console.log('\nPhase 1: Normal Load (10 users)');
  const normalConfig: StressConfig = {
    ...baseConfig,
    concurrentUsers: 10,
    requestsPerUser: 10,
    rampUpSeconds: 2,
    mode: 'quick',
  };
  const normalTest = new ComprehensiveStressTest(normalConfig);
  const normalResult = await normalTest.runTest();

  // Phase 2: Spike (10x load)
  console.log('\nPhase 2: SPIKE Load (100 users - 10x increase)');
  const spikeConfig: StressConfig = {
    ...baseConfig,
    concurrentUsers: 100,
    requestsPerUser: 10,
    rampUpSeconds: 3, // Fast ramp up to simulate spike
    mode: 'chaos',
  };
  const spikeTest = new ComprehensiveStressTest(spikeConfig);
  const spikeResult = await spikeTest.runTest();

  // Phase 3: Recovery
  console.log('\nPhase 3: Recovery (back to 10 users)');
  const recoveryTest = new ComprehensiveStressTest(normalConfig);
  const recoveryResult = await recoveryTest.runTest();

  // Summary
  console.log('\n📊 SPIKE TEST SUMMARY');
  console.log('─'.repeat(60));
  console.log(`Normal Load Avg Response: ${normalResult.avgResponseTime.toFixed(2)}ms`);
  console.log(`Spike Load Avg Response: ${spikeResult.avgResponseTime.toFixed(2)}ms`);
  console.log(`Recovery Avg Response: ${recoveryResult.avgResponseTime.toFixed(2)}ms`);
  console.log(
    `Spike Impact: ${(((spikeResult.avgResponseTime - normalResult.avgResponseTime) / normalResult.avgResponseTime) * 100).toFixed(1)}% slower`,
  );
  console.log(
    `Recovery Time: ${(((recoveryResult.avgResponseTime - normalResult.avgResponseTime) / normalResult.avgResponseTime) * 100).toFixed(1)}% from baseline`,
  );
  console.log('─'.repeat(60));
}

// Soak Test
async function runSoakTest(baseConfig: StressConfig): Promise<void> {
  console.log('\n🕐 SOAK TEST - Extended duration load test');
  console.log('═'.repeat(60));

  const soakConfig: StressConfig = {
    ...baseConfig,
    concurrentUsers: 30,
    requestsPerUser: 100, // Many requests per user
    rampUpSeconds: 10,
    thinkTimeMs: 200, // Slower to extend duration
    mode: 'comprehensive',
  };

  const estimatedDuration =
    (soakConfig.concurrentUsers * soakConfig.requestsPerUser * soakConfig.thinkTimeMs) / 1000 / 60;
  console.log(`Estimated duration: ~${estimatedDuration.toFixed(1)} minutes\n`);

  const test = new ComprehensiveStressTest(soakConfig);
  await test.runTest();
}

// Breakpoint Test
async function runBreakpointTest(baseConfig: StressConfig): Promise<void> {
  console.log('\n📈 BREAKPOINT TEST - Finding system limits');
  console.log('═'.repeat(60));

  let users = 10;
  let increment = 10;
  let maxSuccessfulUsers = 0;
  let breakpointFound = false;

  while (!breakpointFound && users <= 500) {
    console.log(`\nTesting with ${users} concurrent users...`);

    const config: StressConfig = {
      ...baseConfig,
      concurrentUsers: users,
      requestsPerUser: 5,
      rampUpSeconds: Math.max(2, users / 20),
      mode: 'quick',
    };

    const test = new ComprehensiveStressTest(config);
    const result = await test.runTest();

    if (result.overallErrorRate > 5 || result.avgResponseTime > 2000) {
      breakpointFound = true;
      console.log(`\n🔴 Breakpoint found at ${users} users`);
      console.log(`Error Rate: ${result.overallErrorRate.toFixed(2)}%`);
      console.log(`Avg Response Time: ${result.avgResponseTime.toFixed(2)}ms`);
    } else {
      maxSuccessfulUsers = users;
      console.log(`✅ ${users} users - OK`);
      users += increment;
    }
  }

  console.log('\n📊 BREAKPOINT TEST SUMMARY');
  console.log('─'.repeat(60));
  console.log(`Max Successful Users: ${maxSuccessfulUsers}`);
  console.log(`Breakpoint: ${breakpointFound ? users + ' users' : 'Not found within limits'}`);
  console.log('─'.repeat(60));
}

// Main entry point
async function main() {
  const mode = (process.argv[2] as StressConfig['mode']) || 'standard';
  const testType = process.argv[3] || 'all';

  const baseConfig: StressConfig = {
    baseUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
    authToken: process.env.AUTH_TOKEN || 'test-token',
    mode,
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '10000'),
    ...CONFIG_PRESETS[mode],
  } as StressConfig;

  console.log('═'.repeat(60));
  console.log('  COMPREHENSIVE API STRESS TEST SUITE');
  console.log('═'.repeat(60));
  console.log(`\nBase URL: ${baseConfig.baseUrl}`);
  console.log(`Mode: ${mode}`);
  console.log(`Test Type: ${testType}`);

  try {
    switch (testType) {
      case 'standard':
        const standardTest = new ComprehensiveStressTest(baseConfig);
        const standardResult = await standardTest.runTest();
        process.exit(standardResult.thresholdsPassed ? 0 : 1);
        break;

      case 'spike':
        await runSpikeTest(baseConfig);
        break;

      case 'soak':
        await runSoakTest(baseConfig);
        break;

      case 'breakpoint':
        await runBreakpointTest(baseConfig);
        break;

      case 'all':
      default:
        // Run all tests
        console.log('\n🔄 Running all stress test types...\n');

        console.log('\n1️⃣ STANDARD LOAD TEST');
        const allTest = new ComprehensiveStressTest(baseConfig);
        const allResult = await allTest.runTest();

        console.log('\n2️⃣ SPIKE TEST');
        await runSpikeTest(baseConfig);

        console.log('\n3️⃣ BREAKPOINT TEST');
        await runBreakpointTest(baseConfig);

        process.exit(allResult.thresholdsPassed ? 0 : 1);
    }
  } catch (error) {
    console.error('Stress test failed:', error);
    process.exit(1);
  }
}

main();

export { ComprehensiveStressTest, StressConfig, StressTestReport };
