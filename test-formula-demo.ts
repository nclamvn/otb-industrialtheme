/**
 * Formula Demo Script
 * Run: npx ts-node test-formula-demo.ts
 */

import {
  Parser,
  FormulaEvaluator,
  createSimpleContext,
} from './packages/excelai-core/src';

const parser = new Parser();
const evaluator = new FormulaEvaluator();

console.log('═══════════════════════════════════════════════════════════');
console.log('  DAFC ExcelAI Core - Formula Engine Demo');
console.log('═══════════════════════════════════════════════════════════\n');

// Demo 1: Basic Math
console.log('1️⃣  Basic Math:');
const basicMath = evaluator.evaluate(parser.parse('=1 + 2 * 3'), createSimpleContext({}));
console.log(`   =1 + 2 * 3 → ${basicMath}\n`);

// Demo 2: SUM Function
console.log('2️⃣  SUM Function:');
const sumResult = evaluator.evaluate(parser.parse('=SUM(10, 20, 30, 40)'), createSimpleContext({}));
console.log(`   =SUM(10, 20, 30, 40) → ${sumResult}\n`);

// Demo 3: Cell References
console.log('3️⃣  Cell References:');
const cellContext = createSimpleContext({ A1: 100, B1: 50, C1: 25 });
const cellSum = evaluator.evaluate(parser.parse('=A1 + B1 + C1'), cellContext);
console.log(`   Context: A1=100, B1=50, C1=25`);
console.log(`   =A1 + B1 + C1 → ${cellSum}\n`);

// Demo 4: SKU Margin Calculation
console.log('4️⃣  SKU Margin Calculation:');
// A1 = Retail Price, B1 = Cost Price
const skuContext = createSimpleContext({
  A1: 150,  // retailPrice
  B1: 60,   // costPrice
});
const margin = evaluator.evaluate(
  parser.parse('=(A1-B1)/A1*100'),
  skuContext
);
console.log(`   A1 (Retail Price): $150`);
console.log(`   B1 (Cost Price): $60`);
console.log(`   =(A1-B1)/A1*100 → ${margin}%\n`);

// Demo 5: IF Function
console.log('5️⃣  IF Function (Margin Check):');
// A1 = margin value
const marginCheckContext = createSimpleContext({ A1: 60 });
const ifResult = evaluator.evaluate(
  parser.parse('=IF(A1 >= 50, "HIGH MARGIN", "LOW MARGIN")'),
  marginCheckContext
);
console.log(`   A1 (Margin): 60%`);
console.log(`   =IF(A1 >= 50, "HIGH MARGIN", "LOW MARGIN") → "${ifResult}"\n`);

// Demo 6: Complex Pricing Formula
console.log('6️⃣  Complex Pricing Formula:');
// A1=baseCost, B1=shippingCost, C1=tariffPercent, D1=targetMargin
const pricingContext = createSimpleContext({
  A1: 30,  // baseCost
  B1: 5,   // shippingCost
  C1: 10,  // tariffPercent
  D1: 60,  // targetMargin
});
const totalCost = evaluator.evaluate(
  parser.parse('=A1 + B1 + (A1 * C1 / 100)'),
  pricingContext
);
console.log(`   A1 (Base Cost): $30, B1 (Shipping): $5, C1 (Tariff): 10%`);
console.log(`   Total Cost = A1 + B1 + (A1 * C1 / 100) → $${totalCost}`);

// Calculate retail with target margin - E1=totalCost
const retailContext = createSimpleContext({
  E1: totalCost as number,
  D1: 60  // targetMargin
});
const retailPrice = evaluator.evaluate(
  parser.parse('=E1 / (1 - D1/100)'),
  retailContext
);
console.log(`   D1 (Target Margin): 60%`);
console.log(`   Retail Price = E1 / (1 - D1/100) → $${retailPrice}\n`);

// Demo 7: Range Sum
console.log('7️⃣  Range SUM:');
const rangeContext = createSimpleContext({
  A1: 10, A2: 20, A3: 30, A4: 40, A5: 50
});
const rangeSum = evaluator.evaluate(parser.parse('=SUM(A1:A5)'), rangeContext);
console.log(`   Cells: A1=10, A2=20, A3=30, A4=40, A5=50`);
console.log(`   =SUM(A1:A5) → ${rangeSum}\n`);

// Demo 8: AVERAGE
console.log('8️⃣  AVERAGE Function:');
const avgResult = evaluator.evaluate(parser.parse('=AVERAGE(A1:A5)'), rangeContext);
console.log(`   =AVERAGE(A1:A5) → ${avgResult}\n`);

// Demo 9: MIN/MAX
console.log('9️⃣  MIN/MAX Functions:');
const minResult = evaluator.evaluate(parser.parse('=MIN(A1:A5)'), rangeContext);
const maxResult = evaluator.evaluate(parser.parse('=MAX(A1:A5)'), rangeContext);
console.log(`   =MIN(A1:A5) → ${minResult}`);
console.log(`   =MAX(A1:A5) → ${maxResult}\n`);

// Demo 10: Text Functions
console.log('🔟 Text Functions:');
const upperResult = evaluator.evaluate(parser.parse('=UPPER("hello world")'), createSimpleContext({}));
const lenResult = evaluator.evaluate(parser.parse('=LEN("DAFC OTB")'), createSimpleContext({}));
const concatResult = evaluator.evaluate(parser.parse('=CONCATENATE("DAFC", " ", "OTB")'), createSimpleContext({}));
console.log(`   =UPPER("hello world") → "${upperResult}"`);
console.log(`   =LEN("DAFC OTB") → ${lenResult}`);
console.log(`   =CONCATENATE("DAFC", " ", "OTB") → "${concatResult}"\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('  ✅ All demos completed successfully!');
console.log('═══════════════════════════════════════════════════════════\n');
