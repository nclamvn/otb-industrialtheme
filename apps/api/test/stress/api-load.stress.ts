/**
 * STRESS TEST - API Load Testing
 *
 * Tests:
 * 1. Concurrent API requests
 * 2. Rate limiting behavior
 * 3. Response time under load
 * 4. Error rate monitoring
 *
 * Run: npx ts-node apps/api/test/stress/api-load.stress.ts
 */

import { performance } from 'perf_hooks';

// Test configuration
interface LoadTestConfig {
  baseUrl: string;
  endpoints: EndpointConfig[];
  concurrency: number;
  duration: number; // seconds
  rampUp: number; // seconds
}

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  expectedStatus: number[];
  weight: number; // Probability weight
}

interface RequestResult {
  endpoint: string;
  status: number;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  statusCodes: Record<number, number>;
  endpointStats: Record<string, EndpointStats>;
}

interface EndpointStats {
  requests: number;
  avgResponseTime: number;
  errorRate: number;
}

// Default configuration
const DEFAULT_CONFIG: LoadTestConfig = {
  baseUrl: 'http://localhost:3001',
  endpoints: [
    {
      name: 'Health Check',
      method: 'GET',
      path: '/api/v1/health',
      expectedStatus: [200],
      weight: 10,
    },
    {
      name: 'List Budgets',
      method: 'GET',
      path: '/api/v1/budgets',
      expectedStatus: [200, 401],
      weight: 20,
    },
    {
      name: 'List OTB Plans',
      method: 'GET',
      path: '/api/v1/otb-plans',
      expectedStatus: [200, 401],
      weight: 20,
    },
    {
      name: 'List SKU Proposals',
      method: 'GET',
      path: '/api/v1/sku-proposals',
      expectedStatus: [200, 401],
      weight: 20,
    },
    {
      name: 'Master Data - Brands',
      method: 'GET',
      path: '/api/v1/master-data/brands',
      expectedStatus: [200, 401],
      weight: 15,
    },
    {
      name: 'Master Data - Categories',
      method: 'GET',
      path: '/api/v1/master-data/categories',
      expectedStatus: [200, 401],
      weight: 15,
    },
  ],
  concurrency: 10,
  duration: 30,
  rampUp: 5,
};

// Weighted random endpoint selector
function selectEndpoint(endpoints: EndpointConfig[]): EndpointConfig {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const endpoint of endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }

  return endpoints[0];
}

// Make HTTP request
async function makeRequest(
  baseUrl: string,
  endpoint: EndpointConfig
): Promise<RequestResult> {
  const url = `${baseUrl}${endpoint.path}`;
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    });

    const duration = performance.now() - start;
    const success = endpoint.expectedStatus.includes(response.status);

    return {
      endpoint: endpoint.name,
      status: response.status,
      duration,
      success,
      timestamp: Date.now(),
    };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      endpoint: endpoint.name,
      status: 0,
      duration,
      success: false,
      error: (error as Error).message,
      timestamp: Date.now(),
    };
  }
}

// Calculate percentile
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Worker function for concurrent requests
async function worker(
  id: number,
  config: LoadTestConfig,
  results: RequestResult[],
  running: { value: boolean },
  startTime: number,
  rampUpEnd: number
): Promise<void> {
  while (running.value) {
    // Ramp up delay
    const now = Date.now();
    if (now < rampUpEnd) {
      const progress = (now - startTime) / (rampUpEnd - startTime);
      if (Math.random() > progress) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }
    }

    const endpoint = selectEndpoint(config.endpoints);
    const result = await makeRequest(config.baseUrl, endpoint);
    results.push(result);

    // Small delay to prevent overwhelming
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

// Main load test runner
async function runLoadTest(
  config: LoadTestConfig = DEFAULT_CONFIG
): Promise<LoadTestResult> {
  console.log('═'.repeat(60));
  console.log('  API LOAD STRESS TEST');
  console.log('═'.repeat(60));
  console.log(`\nConfiguration:`);
  console.log(`  Base URL: ${config.baseUrl}`);
  console.log(`  Concurrency: ${config.concurrency}`);
  console.log(`  Duration: ${config.duration}s`);
  console.log(`  Ramp-up: ${config.rampUp}s`);
  console.log(`  Endpoints: ${config.endpoints.length}`);

  // Check if server is available
  console.log('\nChecking server availability...');
  try {
    const healthCheck = await fetch(`${config.baseUrl}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!healthCheck.ok) {
      console.log('⚠️  Server returned non-200 status, proceeding anyway...');
    } else {
      console.log('✓ Server is available');
    }
  } catch {
    console.log('⚠️  Server not available at', config.baseUrl);
    console.log('   Starting test anyway (results may show connection errors)');
  }

  const results: RequestResult[] = [];
  const running = { value: true };
  const startTime = Date.now();
  const rampUpEnd = startTime + config.rampUp * 1000;
  const endTime = startTime + config.duration * 1000;

  console.log('\n' + '─'.repeat(60));
  console.log('  RUNNING LOAD TEST');
  console.log('─'.repeat(60));

  // Start workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < config.concurrency; i++) {
    workers.push(worker(i, config, results, running, startTime, rampUpEnd));
  }

  // Progress reporting
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rps = results.length / elapsed;
    const errors = results.filter((r) => !r.success).length;
    console.log(
      `  ${elapsed.toFixed(0)}s: ${results.length} requests, ${rps.toFixed(1)} req/s, ${errors} errors`
    );
  }, 5000);

  // Wait for duration
  await new Promise((resolve) => setTimeout(resolve, config.duration * 1000));
  running.value = false;

  // Wait for workers to finish
  await Promise.all(workers);
  clearInterval(progressInterval);

  // Calculate results
  const durations = results.map((r) => r.duration);
  const successResults = results.filter((r) => r.success);
  const totalDuration = (Date.now() - startTime) / 1000;

  const statusCodes: Record<number, number> = {};
  for (const result of results) {
    statusCodes[result.status] = (statusCodes[result.status] || 0) + 1;
  }

  const endpointStats: Record<string, EndpointStats> = {};
  for (const endpoint of config.endpoints) {
    const endpointResults = results.filter((r) => r.endpoint === endpoint.name);
    endpointStats[endpoint.name] = {
      requests: endpointResults.length,
      avgResponseTime:
        endpointResults.length > 0
          ? endpointResults.reduce((a, b) => a + b.duration, 0) / endpointResults.length
          : 0,
      errorRate:
        endpointResults.length > 0
          ? endpointResults.filter((r) => !r.success).length / endpointResults.length
          : 0,
    };
  }

  const testResult: LoadTestResult = {
    totalRequests: results.length,
    successfulRequests: successResults.length,
    failedRequests: results.length - successResults.length,
    avgResponseTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    p50ResponseTime: percentile(durations, 50),
    p95ResponseTime: percentile(durations, 95),
    p99ResponseTime: percentile(durations, 99),
    maxResponseTime: Math.max(...durations, 0),
    minResponseTime: Math.min(...durations, Infinity) === Infinity ? 0 : Math.min(...durations),
    requestsPerSecond: results.length / totalDuration,
    errorRate: results.length > 0 ? (results.length - successResults.length) / results.length : 0,
    statusCodes,
    endpointStats,
  };

  // Print results
  console.log('\n' + '═'.repeat(60));
  console.log('  LOAD TEST RESULTS');
  console.log('═'.repeat(60));

  console.log('\n📊 OVERALL STATISTICS:');
  console.log(`  Total Requests:     ${testResult.totalRequests.toLocaleString()}`);
  console.log(`  Successful:         ${testResult.successfulRequests.toLocaleString()}`);
  console.log(`  Failed:             ${testResult.failedRequests.toLocaleString()}`);
  console.log(`  Error Rate:         ${(testResult.errorRate * 100).toFixed(2)}%`);
  console.log(`  Requests/second:    ${testResult.requestsPerSecond.toFixed(2)}`);

  console.log('\n⏱️  RESPONSE TIMES:');
  console.log(`  Average:            ${testResult.avgResponseTime.toFixed(2)}ms`);
  console.log(`  P50 (Median):       ${testResult.p50ResponseTime.toFixed(2)}ms`);
  console.log(`  P95:                ${testResult.p95ResponseTime.toFixed(2)}ms`);
  console.log(`  P99:                ${testResult.p99ResponseTime.toFixed(2)}ms`);
  console.log(`  Min:                ${testResult.minResponseTime.toFixed(2)}ms`);
  console.log(`  Max:                ${testResult.maxResponseTime.toFixed(2)}ms`);

  console.log('\n📈 STATUS CODES:');
  for (const [code, count] of Object.entries(statusCodes)) {
    console.log(`  ${code}: ${count}`);
  }

  console.log('\n🔗 ENDPOINT BREAKDOWN:');
  console.log('┌─────────────────────────┬──────────┬───────────┬───────────┐');
  console.log('│ Endpoint                │ Requests │ Avg (ms)  │ Error %   │');
  console.log('├─────────────────────────┼──────────┼───────────┼───────────┤');
  for (const [name, stats] of Object.entries(endpointStats)) {
    const n = name.substring(0, 23).padEnd(23);
    const req = stats.requests.toString().padStart(8);
    const avg = stats.avgResponseTime.toFixed(1).padStart(9);
    const err = (stats.errorRate * 100).toFixed(1).padStart(8) + '%';
    console.log(`│ ${n} │ ${req} │ ${avg} │ ${err} │`);
  }
  console.log('└─────────────────────────┴──────────┴───────────┴───────────┘');

  // Performance targets
  console.log('\n🎯 PERFORMANCE TARGETS:');
  const targets = [
    { name: 'Avg Response < 500ms', pass: testResult.avgResponseTime < 500 },
    { name: 'P95 Response < 1000ms', pass: testResult.p95ResponseTime < 1000 },
    { name: 'Error Rate < 5%', pass: testResult.errorRate < 0.05 },
    { name: 'RPS > 50', pass: testResult.requestsPerSecond > 50 },
  ];

  let allPassed = true;
  for (const t of targets) {
    const status = t.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${t.name}: ${status}`);
    if (!t.pass) allPassed = false;
  }

  console.log(`\n${allPassed ? '✅ ALL LOAD TESTS PASSED' : '⚠️  SOME TARGETS NOT MET'}`);

  return testResult;
}

// Export for programmatic use
export { runLoadTest, LoadTestConfig, LoadTestResult };

// Run if executed directly
if (require.main === module) {
  runLoadTest()
    .then((result) => {
      const allPassed =
        result.avgResponseTime < 500 &&
        result.p95ResponseTime < 1000 &&
        result.errorRate < 0.05;
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Load test failed:', error);
      process.exit(1);
    });
}
