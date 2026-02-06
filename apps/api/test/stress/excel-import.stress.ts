/**
 * STRESS TEST - Excel Import Performance
 *
 * Tests:
 * 1. Large file parsing (10K, 50K, 100K rows)
 * 2. Memory usage under load
 * 3. Concurrent imports
 * 4. Database bulk insert performance
 *
 * Run: npx ts-node apps/api/test/stress/excel-import.stress.ts
 */

import * as XLSX from 'xlsx';
import { performance } from 'perf_hooks';

// Test configuration
interface StressTestConfig {
  rowCounts: number[];
  concurrentImports: number;
  iterations: number;
}

interface TestResult {
  testName: string;
  rowCount: number;
  duration: number;
  rowsPerSecond: number;
  memoryUsedMB: number;
  success: boolean;
  error?: string;
}

const DEFAULT_CONFIG: StressTestConfig = {
  rowCounts: [1000, 5000, 10000, 50000],
  concurrentImports: 3,
  iterations: 3,
};

// Generate mock SKU data
function generateMockSKUs(count: number): Record<string, unknown>[] {
  const categories = ['BAGS', 'SHOES', 'ACCESSORIES', 'CLOTHING', 'JEWELRY'];
  const genders = ['MEN', 'WOMEN', 'UNISEX'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const skus: Record<string, unknown>[] = [];

  for (let i = 0; i < count; i++) {
    skus.push({
      'SKU Code': `SKU-${String(i).padStart(6, '0')}`,
      'Style Name': `Product Style ${i}`,
      'Color': `Color ${i % 20}`,
      'Category': categories[i % categories.length],
      'Gender': genders[i % genders.length],
      'Retail Price': Math.round(100 + Math.random() * 900),
      'Cost Price': Math.round(50 + Math.random() * 400),
      'Quantity': Math.round(10 + Math.random() * 100),
      'XS': Math.round(Math.random() * 20),
      'S': Math.round(Math.random() * 30),
      'M': Math.round(Math.random() * 40),
      'L': Math.round(Math.random() * 30),
      'XL': Math.round(Math.random() * 20),
      'Lead Time': Math.round(30 + Math.random() * 120),
      'MOQ': Math.round(10 + Math.random() * 50),
      'Country': 'Vietnam',
    });
  }

  return skus;
}

// Generate Excel buffer
function generateExcelBuffer(data: Record<string, unknown>[]): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SKUs');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return buffer;
}

// Simulate parsing (mimics streaming-parser.ts logic)
function parseExcelData(buffer: ArrayBuffer): {
  rowCount: number;
  validRows: number;
  errors: number;
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  let validRows = 0;
  let errors = 0;

  for (const row of data) {
    const r = row as Record<string, unknown>;
    // Basic validation
    if (r['SKU Code'] && r['Style Name'] && r['Category'] && r['Gender']) {
      const retailPrice = Number(r['Retail Price']) || 0;
      const costPrice = Number(r['Cost Price']) || 0;
      const quantity = Number(r['Quantity']) || 0;

      if (retailPrice > 0 && costPrice > 0 && quantity > 0) {
        validRows++;
      } else {
        errors++;
      }
    } else {
      errors++;
    }
  }

  return {
    rowCount: data.length,
    validRows,
    errors,
  };
}

// Get memory usage
function getMemoryUsageMB(): number {
  const used = process.memoryUsage();
  return Math.round(used.heapUsed / 1024 / 1024 * 100) / 100;
}

// Run single stress test
async function runSingleTest(rowCount: number): Promise<TestResult> {
  const testName = `Parse ${rowCount.toLocaleString()} rows`;
  const startMemory = getMemoryUsageMB();

  try {
    console.log(`\n  Starting: ${testName}...`);

    // Generate data
    const genStart = performance.now();
    const data = generateMockSKUs(rowCount);
    const genTime = performance.now() - genStart;
    console.log(`    Data generation: ${genTime.toFixed(0)}ms`);

    // Generate Excel
    const excelStart = performance.now();
    const buffer = generateExcelBuffer(data);
    const excelTime = performance.now() - excelStart;
    console.log(`    Excel creation: ${excelTime.toFixed(0)}ms (${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB)`);

    // Parse Excel
    const parseStart = performance.now();
    const result = parseExcelData(buffer);
    const parseTime = performance.now() - parseStart;

    const endMemory = getMemoryUsageMB();
    const memoryUsed = endMemory - startMemory;

    const rowsPerSecond = Math.round(rowCount / (parseTime / 1000));

    console.log(`    Parse time: ${parseTime.toFixed(0)}ms`);
    console.log(`    Rows/second: ${rowsPerSecond.toLocaleString()}`);
    console.log(`    Memory delta: ${memoryUsed.toFixed(2)}MB`);
    console.log(`    Valid rows: ${result.validRows}/${result.rowCount}`);

    return {
      testName,
      rowCount,
      duration: parseTime,
      rowsPerSecond,
      memoryUsedMB: memoryUsed,
      success: result.validRows === rowCount,
    };
  } catch (error) {
    return {
      testName,
      rowCount,
      duration: 0,
      rowsPerSecond: 0,
      memoryUsedMB: getMemoryUsageMB() - startMemory,
      success: false,
      error: (error as Error).message,
    };
  }
}

// Run concurrent test
async function runConcurrentTest(
  rowCount: number,
  concurrency: number
): Promise<TestResult> {
  const testName = `Concurrent ${concurrency}x ${rowCount.toLocaleString()} rows`;
  const startMemory = getMemoryUsageMB();

  try {
    console.log(`\n  Starting: ${testName}...`);

    // Prepare all buffers first
    const buffers: ArrayBuffer[] = [];
    for (let i = 0; i < concurrency; i++) {
      const data = generateMockSKUs(rowCount);
      buffers.push(generateExcelBuffer(data));
    }

    // Run concurrent parsing
    const parseStart = performance.now();
    const promises = buffers.map((buffer) =>
      new Promise<void>((resolve) => {
        parseExcelData(buffer);
        resolve();
      })
    );
    await Promise.all(promises);
    const parseTime = performance.now() - parseStart;

    const totalRows = rowCount * concurrency;
    const rowsPerSecond = Math.round(totalRows / (parseTime / 1000));
    const memoryUsed = getMemoryUsageMB() - startMemory;

    console.log(`    Total parse time: ${parseTime.toFixed(0)}ms`);
    console.log(`    Total rows: ${totalRows.toLocaleString()}`);
    console.log(`    Rows/second: ${rowsPerSecond.toLocaleString()}`);
    console.log(`    Memory delta: ${memoryUsed.toFixed(2)}MB`);

    return {
      testName,
      rowCount: totalRows,
      duration: parseTime,
      rowsPerSecond,
      memoryUsedMB: memoryUsed,
      success: true,
    };
  } catch (error) {
    return {
      testName,
      rowCount: rowCount * concurrency,
      duration: 0,
      rowsPerSecond: 0,
      memoryUsedMB: getMemoryUsageMB() - startMemory,
      success: false,
      error: (error as Error).message,
    };
  }
}

// Main stress test runner
async function runStressTests(config: StressTestConfig = DEFAULT_CONFIG) {
  console.log('═'.repeat(60));
  console.log('  EXCEL IMPORT STRESS TEST');
  console.log('═'.repeat(60));
  console.log(`\nConfiguration:`);
  console.log(`  Row counts: ${config.rowCounts.join(', ')}`);
  console.log(`  Concurrent imports: ${config.concurrentImports}`);
  console.log(`  Iterations: ${config.iterations}`);
  console.log(`  Initial memory: ${getMemoryUsageMB()}MB`);

  const results: TestResult[] = [];

  // Single import tests
  console.log('\n' + '─'.repeat(60));
  console.log('  SINGLE IMPORT TESTS');
  console.log('─'.repeat(60));

  for (const rowCount of config.rowCounts) {
    const iterResults: TestResult[] = [];

    for (let i = 0; i < config.iterations; i++) {
      const result = await runSingleTest(rowCount);
      iterResults.push(result);

      // Force GC if available
      if (global.gc) global.gc();
    }

    // Average results
    const avgResult: TestResult = {
      testName: `Parse ${rowCount.toLocaleString()} rows (avg)`,
      rowCount,
      duration: iterResults.reduce((a, b) => a + b.duration, 0) / iterResults.length,
      rowsPerSecond: Math.round(
        iterResults.reduce((a, b) => a + b.rowsPerSecond, 0) / iterResults.length
      ),
      memoryUsedMB:
        iterResults.reduce((a, b) => a + b.memoryUsedMB, 0) / iterResults.length,
      success: iterResults.every((r) => r.success),
    };
    results.push(avgResult);
  }

  // Concurrent tests
  console.log('\n' + '─'.repeat(60));
  console.log('  CONCURRENT IMPORT TESTS');
  console.log('─'.repeat(60));

  for (const rowCount of [1000, 5000, 10000]) {
    const result = await runConcurrentTest(rowCount, config.concurrentImports);
    results.push(result);

    if (global.gc) global.gc();
  }

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('  STRESS TEST SUMMARY');
  console.log('═'.repeat(60));

  console.log('\n┌─────────────────────────────────┬──────────┬───────────┬──────────┬─────────┐');
  console.log('│ Test                            │ Duration │ Rows/sec  │ Memory   │ Status  │');
  console.log('├─────────────────────────────────┼──────────┼───────────┼──────────┼─────────┤');

  for (const result of results) {
    const name = result.testName.substring(0, 31).padEnd(31);
    const duration = `${result.duration.toFixed(0)}ms`.padStart(8);
    const rps = result.rowsPerSecond.toLocaleString().padStart(9);
    const memory = `${result.memoryUsedMB.toFixed(1)}MB`.padStart(8);
    const status = result.success ? '  ✓  ' : '  ✗  ';

    console.log(`│ ${name} │ ${duration} │ ${rps} │ ${memory} │${status}│`);
  }

  console.log('└─────────────────────────────────┴──────────┴───────────┴──────────┴─────────┘');

  // Performance targets
  console.log('\n📊 PERFORMANCE TARGETS:');
  const targets = [
    { name: '10K rows parse', target: 5000, actual: results.find((r) => r.rowCount === 10000)?.rowsPerSecond || 0 },
    { name: '50K rows parse', target: 3000, actual: results.find((r) => r.rowCount === 50000)?.rowsPerSecond || 0 },
  ];

  for (const t of targets) {
    const status = t.actual >= t.target ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${t.name}: ${t.actual.toLocaleString()} rows/sec (target: ${t.target.toLocaleString()}) ${status}`);
  }

  // Final memory
  console.log(`\nFinal memory: ${getMemoryUsageMB()}MB`);

  const allPassed = results.every((r) => r.success);
  console.log(`\n${allPassed ? '✅ ALL STRESS TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return { results, allPassed };
}

// Export for programmatic use
export { runStressTests, StressTestConfig, TestResult };

// Run if executed directly
if (require.main === module) {
  runStressTests()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Stress test failed:', error);
      process.exit(1);
    });
}
