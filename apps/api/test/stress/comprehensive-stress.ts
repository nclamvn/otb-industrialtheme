/**
 * Comprehensive Stress Test Suite
 * Tests API performance under various load conditions
 */

interface StressTestConfig {
  baseUrl: string;
  authToken: string;
  concurrentUsers: number;
  requestsPerUser: number;
  rampUpSeconds: number;
  thinkTimeMs: number;
}

interface TestResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

interface RequestMetric {
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  error?: string;
}

class StressTestRunner {
  private config: StressTestConfig;
  private metrics: Map<string, RequestMetric[]> = new Map();

  constructor(config: StressTestConfig) {
    this.config = config;
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

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.authToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      status = response.status;
      success = response.ok;
    } catch (e) {
      error = (e as Error).message;
    }

    const endTime = Date.now();

    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      status,
      success,
      error,
    };
  }

  private async simulateUser(
    endpoint: string,
    method: string = 'GET',
    body?: any,
  ): Promise<void> {
    for (let i = 0; i < this.config.requestsPerUser; i++) {
      const metric = await this.makeRequest(endpoint, method, body);

      const key = `${method}:${endpoint}`;
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      this.metrics.get(key)!.push(metric);

      // Think time between requests
      if (this.config.thinkTimeMs > 0) {
        await this.sleep(this.config.thinkTimeMs);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private generateReport(key: string): TestResult {
    const [method, endpoint] = key.split(':');
    const requestMetrics = this.metrics.get(key) || [];

    const durations = requestMetrics.map((m) => m.duration);
    const successful = requestMetrics.filter((m) => m.success).length;
    const failed = requestMetrics.filter((m) => !m.success).length;

    const totalDuration =
      requestMetrics.length > 0
        ? (requestMetrics[requestMetrics.length - 1].endTime - requestMetrics[0].startTime) /
          1000
        : 0;

    return {
      endpoint,
      method,
      totalRequests: requestMetrics.length,
      successfulRequests: successful,
      failedRequests: failed,
      avgResponseTime:
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
      p50ResponseTime: this.calculatePercentile(durations, 50),
      p95ResponseTime: this.calculatePercentile(durations, 95),
      p99ResponseTime: this.calculatePercentile(durations, 99),
      requestsPerSecond: totalDuration > 0 ? requestMetrics.length / totalDuration : 0,
      errorRate: requestMetrics.length > 0 ? (failed / requestMetrics.length) * 100 : 0,
    };
  }

  async runEndpointTest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
  ): Promise<TestResult> {
    console.log(`\nStarting stress test for ${method} ${endpoint}`);
    console.log(`Concurrent users: ${this.config.concurrentUsers}`);
    console.log(`Requests per user: ${this.config.requestsPerUser}`);

    const users = [];
    const rampUpInterval = (this.config.rampUpSeconds * 1000) / this.config.concurrentUsers;

    for (let i = 0; i < this.config.concurrentUsers; i++) {
      await this.sleep(rampUpInterval);
      users.push(this.simulateUser(endpoint, method, body));
    }

    await Promise.all(users);

    const result = this.generateReport(`${method}:${endpoint}`);
    this.printResult(result);

    return result;
  }

  private printResult(result: TestResult): void {
    console.log('\n========== STRESS TEST RESULTS ==========');
    console.log(`Endpoint: ${result.method} ${result.endpoint}`);
    console.log('------------------------------------------');
    console.log(`Total Requests: ${result.totalRequests}`);
    console.log(`Successful: ${result.successfulRequests}`);
    console.log(`Failed: ${result.failedRequests}`);
    console.log(`Error Rate: ${result.errorRate.toFixed(2)}%`);
    console.log('------------------------------------------');
    console.log(`Avg Response Time: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${result.minResponseTime}ms`);
    console.log(`Max Response Time: ${result.maxResponseTime}ms`);
    console.log(`P50 Response Time: ${result.p50ResponseTime}ms`);
    console.log(`P95 Response Time: ${result.p95ResponseTime}ms`);
    console.log(`P99 Response Time: ${result.p99ResponseTime}ms`);
    console.log('------------------------------------------');
    console.log(`Requests/Second: ${result.requestsPerSecond.toFixed(2)}`);
    console.log('==========================================\n');
  }
}

// Stress Test Scenarios
async function runComprehensiveStressTests() {
  const config: StressTestConfig = {
    baseUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
    authToken: process.env.AUTH_TOKEN || 'test-token',
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '50'),
    requestsPerUser: parseInt(process.env.REQUESTS_PER_USER || '10'),
    rampUpSeconds: parseInt(process.env.RAMP_UP_SECONDS || '5'),
    thinkTimeMs: parseInt(process.env.THINK_TIME_MS || '100'),
  };

  const runner = new StressTestRunner(config);
  const results: TestResult[] = [];

  console.log('\n🚀 Starting Comprehensive Stress Tests\n');
  console.log('Configuration:');
  console.log(JSON.stringify(config, null, 2));

  // Test Scenarios
  const scenarios = [
    // Read-heavy endpoints
    { endpoint: '/health', method: 'GET' },
    { endpoint: '/budgets', method: 'GET' },
    { endpoint: '/budgets?page=1&limit=20', method: 'GET' },
    { endpoint: '/otb-plans', method: 'GET' },
    { endpoint: '/brands', method: 'GET' },
    { endpoint: '/seasons', method: 'GET' },
    { endpoint: '/locations', method: 'GET' },

    // Search endpoints
    { endpoint: '/budgets?status=APPROVED', method: 'GET' },
    { endpoint: '/budgets?status=DRAFT', method: 'GET' },
  ];

  for (const scenario of scenarios) {
    try {
      const result = await runner.runEndpointTest(
        scenario.endpoint,
        scenario.method,
        (scenario as any).body,
      );
      results.push(result);
    } catch (error) {
      console.error(`Error testing ${scenario.endpoint}:`, error);
    }
  }

  // Summary Report
  console.log('\n📊 COMPREHENSIVE STRESS TEST SUMMARY\n');
  console.log('=====================================');

  let totalRequests = 0;
  let totalFailed = 0;
  let avgResponseTimes: number[] = [];

  results.forEach((result) => {
    totalRequests += result.totalRequests;
    totalFailed += result.failedRequests;
    avgResponseTimes.push(result.avgResponseTime);
  });

  const overallAvgResponse =
    avgResponseTimes.length > 0
      ? avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length
      : 0;

  console.log(`Total Endpoints Tested: ${results.length}`);
  console.log(`Total Requests Made: ${totalRequests}`);
  console.log(`Total Failed Requests: ${totalFailed}`);
  console.log(`Overall Error Rate: ${((totalFailed / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Overall Avg Response Time: ${overallAvgResponse.toFixed(2)}ms`);
  console.log('=====================================\n');

  // Performance Thresholds Check
  console.log('\n🎯 PERFORMANCE THRESHOLD CHECK\n');

  const thresholds = {
    maxAvgResponseTime: 500, // ms
    maxP95ResponseTime: 1000, // ms
    maxP99ResponseTime: 2000, // ms
    maxErrorRate: 1, // %
    minRequestsPerSecond: 50,
  };

  let allPassed = true;

  results.forEach((result) => {
    const passed =
      result.avgResponseTime <= thresholds.maxAvgResponseTime &&
      result.p95ResponseTime <= thresholds.maxP95ResponseTime &&
      result.p99ResponseTime <= thresholds.maxP99ResponseTime &&
      result.errorRate <= thresholds.maxErrorRate;

    if (!passed) {
      allPassed = false;
      console.log(`❌ ${result.method} ${result.endpoint} - FAILED THRESHOLDS`);
      if (result.avgResponseTime > thresholds.maxAvgResponseTime) {
        console.log(
          `   Avg Response: ${result.avgResponseTime.toFixed(2)}ms > ${thresholds.maxAvgResponseTime}ms`,
        );
      }
      if (result.p95ResponseTime > thresholds.maxP95ResponseTime) {
        console.log(
          `   P95 Response: ${result.p95ResponseTime}ms > ${thresholds.maxP95ResponseTime}ms`,
        );
      }
      if (result.errorRate > thresholds.maxErrorRate) {
        console.log(
          `   Error Rate: ${result.errorRate.toFixed(2)}% > ${thresholds.maxErrorRate}%`,
        );
      }
    } else {
      console.log(`✅ ${result.method} ${result.endpoint} - PASSED`);
    }
  });

  console.log('\n=====================================');
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('=====================================\n');

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Spike Test - Sudden load increase
async function runSpikeTest() {
  console.log('\n⚡ Starting Spike Test\n');

  const normalConfig: StressTestConfig = {
    baseUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
    authToken: process.env.AUTH_TOKEN || 'test-token',
    concurrentUsers: 10,
    requestsPerUser: 5,
    rampUpSeconds: 1,
    thinkTimeMs: 50,
  };

  const spikeConfig: StressTestConfig = {
    ...normalConfig,
    concurrentUsers: 100,
    requestsPerUser: 10,
    rampUpSeconds: 2,
  };

  const normalRunner = new StressTestRunner(normalConfig);
  const spikeRunner = new StressTestRunner(spikeConfig);

  console.log('Phase 1: Normal Load');
  const normalResult = await normalRunner.runEndpointTest('/budgets');

  console.log('Phase 2: Spike Load (10x users)');
  const spikeResult = await spikeRunner.runEndpointTest('/budgets');

  console.log('Phase 3: Return to Normal Load');
  const recoveryResult = await normalRunner.runEndpointTest('/budgets');

  console.log('\n📈 SPIKE TEST COMPARISON\n');
  console.log('=====================================');
  console.log(`Normal Load Avg Response: ${normalResult.avgResponseTime.toFixed(2)}ms`);
  console.log(`Spike Load Avg Response: ${spikeResult.avgResponseTime.toFixed(2)}ms`);
  console.log(`Recovery Load Avg Response: ${recoveryResult.avgResponseTime.toFixed(2)}ms`);
  console.log(
    `Response Time Increase: ${(
      ((spikeResult.avgResponseTime - normalResult.avgResponseTime) /
        normalResult.avgResponseTime) *
      100
    ).toFixed(2)}%`,
  );
  console.log('=====================================\n');
}

// Soak Test - Extended duration
async function runSoakTest() {
  console.log('\n🕐 Starting Soak Test (Extended Duration)\n');

  const config: StressTestConfig = {
    baseUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
    authToken: process.env.AUTH_TOKEN || 'test-token',
    concurrentUsers: 20,
    requestsPerUser: 100,
    rampUpSeconds: 10,
    thinkTimeMs: 200,
  };

  const runner = new StressTestRunner(config);

  console.log(`Duration: ~${(config.concurrentUsers * config.requestsPerUser * config.thinkTimeMs) / 1000 / 60} minutes`);

  const result = await runner.runEndpointTest('/budgets');

  console.log('\n🏁 SOAK TEST COMPLETE\n');
  console.log(`Total Requests: ${result.totalRequests}`);
  console.log(`Error Rate: ${result.errorRate.toFixed(2)}%`);
  console.log(`Avg Response Time: ${result.avgResponseTime.toFixed(2)}ms`);
}

// Main entry point
const testType = process.argv[2] || 'comprehensive';

switch (testType) {
  case 'comprehensive':
    runComprehensiveStressTests();
    break;
  case 'spike':
    runSpikeTest();
    break;
  case 'soak':
    runSoakTest();
    break;
  default:
    console.log('Usage: ts-node comprehensive-stress.ts [comprehensive|spike|soak]');
    process.exit(1);
}
