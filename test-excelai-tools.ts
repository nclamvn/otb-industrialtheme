/**
 * ExcelAI Tools Demo Script
 * Run: npx ts-node test-excelai-tools.ts
 */

import {
  NLFormulaEngine,
  DataCleaner,
  createSKUCleaner,
} from './packages/excelai-tools/src';

console.log('═══════════════════════════════════════════════════════════');
console.log('  DAFC ExcelAI Tools - Phase 2 Demo');
console.log('═══════════════════════════════════════════════════════════\n');

// ============================================================
// Part 1: NL Formula Engine Demo
// ============================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  NL Formula Engine - Vietnamese to Excel Formula');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const nlEngine = new NLFormulaEngine();

const testPhrases = [
  'tính margin từ giá bán và giá vốn',
  'tính tổng giá trị',
  'tính lợi nhuận',
  'tính trung bình số lượng',
  'tính tổng của số lượng',
];

testPhrases.forEach((phrase, i) => {
  const result = nlEngine.convert(phrase);
  console.log(`${i + 1}. Input: "${phrase}"`);
  console.log(`   Intent: ${result.intent.type} (confidence: ${(result.intent.confidence * 100).toFixed(0)}%)`);
  console.log(`   Formula: ${result.formula}`);
  console.log(`   Success: ${result.success ? 'Yes' : 'No'}`);
  console.log('');
});

// Quick convert examples
console.log('Quick Convert Examples:');
console.log(`  "tính margin" → ${nlEngine.quickConvert('tính margin')}`);
console.log(`  "tính tổng" → ${nlEngine.quickConvert('tính tổng')}`);
console.log('');

// ============================================================
// Part 2: Data Cleaner Demo
// ============================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Data Cleaner - Data Quality Analysis');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testData = [
  { sku: 'SKU001', styleName: 'Classic Polo', category: 'Tops', gender: 'Men', retailPrice: 150, costPrice: 60, quantity: 100 },
  { sku: 'SKU002', styleName: 'Premium Blazer', category: 'Outerwear', gender: 'Men', retailPrice: 450, costPrice: 180, quantity: 50 },
  { sku: 'SKU003', styleName: 'Summer Dress', category: 'Dresses', gender: 'Women', retailPrice: 200, costPrice: 80, quantity: 75 },
  { sku: 'SKU001', styleName: 'Classic Polo Dup', category: 'Tops', gender: 'MEN', retailPrice: 150, costPrice: 60, quantity: 100 }, // Duplicate + inconsistent gender
  { sku: '', styleName: 'Missing SKU', category: 'tops', gender: 'Men', retailPrice: 120, costPrice: 48, quantity: 200 }, // Missing SKU + inconsistent category
  { sku: 'SKU006', styleName: 'Outlier Item', category: 'Accessories', gender: 'Unisex', retailPrice: 10000, costPrice: 5000, quantity: 1 }, // Possible outlier
];

console.log(`Analyzing ${testData.length} SKU records...\n`);

const cleaner = createSKUCleaner();
const result = cleaner.analyze(testData);

console.log('Quality Score:');
console.log(`  Overall: ${result.qualityScore.overall}%`);
console.log(`  Completeness: ${result.qualityScore.completeness}%`);
console.log(`  Accuracy: ${result.qualityScore.accuracy}%`);
console.log(`  Consistency: ${result.qualityScore.consistency}%`);
console.log(`  Validity: ${result.qualityScore.validity}%`);
console.log('');

console.log('Summary:');
console.log(`  Total Rows: ${result.originalRowCount}`);
console.log(`  Issues Found: ${result.issuesFound}`);
console.log(`  Execution Time: ${result.summary.executionTimeMs}ms`);
console.log('');

if (result.issues.length > 0) {
  console.log('Issues Detected:');
  const issuesBySeverity = cleaner.getIssuesBySeverity(result);

  if (issuesBySeverity.critical.length > 0) {
    console.log('\n  Critical Issues:');
    issuesBySeverity.critical.forEach(issue => {
      console.log(`    - Row ${issue.row}, ${issue.column}: ${issue.message}`);
    });
  }

  if (issuesBySeverity.warning.length > 0) {
    console.log('\n  Warnings:');
    issuesBySeverity.warning.slice(0, 5).forEach(issue => {
      console.log(`    - Row ${issue.row}, ${issue.column}: ${issue.message}`);
    });
    if (issuesBySeverity.warning.length > 5) {
      console.log(`    ... and ${issuesBySeverity.warning.length - 5} more`);
    }
  }
}

// Clean the data
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Cleaning Data...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const cleanerWithFix = new DataCleaner({
  ...cleaner.getConfig(),
  autoFix: true,
  removeDuplicates: true,
});

const cleanResult = cleanerWithFix.clean(testData);

console.log('Cleaning Results:');
console.log(`  Original Rows: ${cleanResult.originalRowCount}`);
console.log(`  Cleaned Rows: ${cleanResult.cleanedRowCount}`);
console.log(`  Issues Fixed: ${cleanResult.issuesFixed}`);
console.log(`  Duplicates Removed: ${cleanResult.summary.duplicatesRemoved}`);
console.log('');

if (cleanResult.cleanedData) {
  console.log('Cleaned Data Preview:');
  cleanResult.cleanedData.slice(0, 3).forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.sku}: ${row.styleName} - $${row.retailPrice}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Phase 2 Demo Complete!');
console.log('═══════════════════════════════════════════════════════════\n');
