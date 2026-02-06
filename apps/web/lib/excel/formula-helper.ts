/**
 * Formula Helper for Excel Import
 * Detects and evaluates formulas in imported Excel data
 */

import {
  Parser,
  FormulaEvaluator,
  createSimpleContext,
  FormulaError,
  type FormulaValue,
} from '@dafc/excelai-core';

const parser = new Parser();
const evaluator = new FormulaEvaluator();

/**
 * Check if a value is a formula
 */
export function isFormula(value: unknown): boolean {
  return typeof value === 'string' && value.trim().startsWith('=');
}

/**
 * Evaluate a single formula with context
 * Accepts Record<string, unknown> for flexibility with raw Excel data
 */
export function evaluateFormula(
  formula: string,
  context: Record<string, unknown>
): { success: boolean; value: FormulaValue; error?: string } {
  try {
    const normalizedFormula = formula.startsWith('=') ? formula : `=${formula}`;
    const ast = parser.parse(normalizedFormula);

    // Convert context to FormulaValue compatible format
    const formulaContext: Record<string, FormulaValue> = {};
    for (const [key, val] of Object.entries(context)) {
      if (typeof val === 'number') {
        formulaContext[key] = val;
      } else if (typeof val === 'string') {
        formulaContext[key] = val;
      } else if (typeof val === 'boolean') {
        formulaContext[key] = val;
      } else if (val === null) {
        formulaContext[key] = null;
      }
    }

    const evalContext = createSimpleContext(formulaContext);
    const value = evaluator.evaluate(ast, evalContext);

    if (value instanceof FormulaError) {
      return { success: false, value: null, error: value.type };
    }

    return { success: true, value };
  } catch (error) {
    return {
      success: false,
      value: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a row of data, evaluating any formulas
 * Returns the row with formulas replaced by computed values
 */
export function processRowWithFormulas(
  row: Record<string, unknown>,
  additionalContext: Record<string, FormulaValue> = {}
): Record<string, FormulaValue> {
  const result: Record<string, FormulaValue> = {};
  const context: Record<string, FormulaValue> = { ...additionalContext };

  // First pass: collect non-formula values for context
  for (const [key, value] of Object.entries(row)) {
    if (!isFormula(value)) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const finalValue = isNaN(numValue as number) ? (value as FormulaValue) : (numValue as number);
      context[key] = finalValue;
      result[key] = finalValue;
    }
  }

  // Second pass: evaluate formulas
  for (const [key, value] of Object.entries(row)) {
    if (isFormula(value)) {
      const evalResult = evaluateFormula(value as string, context);
      result[key] = evalResult.success ? evalResult.value : null;

      // Add computed value to context for dependent formulas
      if (evalResult.success && evalResult.value !== null) {
        context[key] = evalResult.value;
      }
    }
  }

  return result;
}

/**
 * Calculate margin from retail and cost prices
 */
export function calculateMargin(retailPrice: number, costPrice: number): number {
  if (retailPrice <= 0) return 0;
  return ((retailPrice - costPrice) / retailPrice) * 100;
}

/**
 * Detect formulas in Excel worksheet data
 * Returns list of cells containing formulas
 */
export function detectFormulasInData(
  data: Record<string, unknown>[]
): Array<{ row: number; column: string; formula: string }> {
  const formulas: Array<{ row: number; column: string; formula: string }> = [];

  data.forEach((row, rowIndex) => {
    for (const [column, value] of Object.entries(row)) {
      if (isFormula(value)) {
        formulas.push({
          row: rowIndex + 2, // Excel row (1-indexed + header)
          column,
          formula: value as string,
        });
      }
    }
  });

  return formulas;
}

/**
 * Create SKU calculation context from parsed row
 * Maps common SKU fields to formula-friendly names
 */
export function createSKUFormulaContext(row: Record<string, unknown>): Record<string, FormulaValue> {
  const context: Record<string, FormulaValue> = {};

  // Map common fields
  const fieldMappings: Record<string, string[]> = {
    retailPrice: ['retail', 'retail_price', 'retailprice', 'retail price', 'rrp', 'price'],
    costPrice: ['cost', 'cost_price', 'costprice', 'cost price', 'wholesale'],
    quantity: ['qty', 'quantity', 'order_qty', 'orderqty', 'order quantity', 'units'],
    margin: ['margin', 'margin %', 'margin_pct', 'profit margin'],
  };

  for (const [field, aliases] of Object.entries(fieldMappings)) {
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.toLowerCase().trim();
      if (aliases.includes(normalizedKey)) {
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[$€£,]/g, '')) : value;
        if (!isNaN(numValue as number)) {
          context[field] = numValue as number;
          break;
        }
      }
    }
  }

  // Also add raw column values as potential formula references
  for (const [key, value] of Object.entries(row)) {
    const numValue = typeof value === 'string' ? parseFloat(String(value).replace(/[$€£,]/g, '')) : value;
    if (!isNaN(numValue as number)) {
      context[key] = numValue as number;
    } else if (typeof value === 'string' && !isFormula(value)) {
      context[key] = value;
    }
  }

  return context;
}

/**
 * Built-in formula templates for SKU calculations
 */
export const SKU_FORMULA_TEMPLATES = {
  margin: '=(retailPrice-costPrice)/retailPrice*100',
  totalValue: '=quantity*retailPrice',
  totalCost: '=quantity*costPrice',
  profit: '=quantity*(retailPrice-costPrice)',
  markupPercent: '=(retailPrice-costPrice)/costPrice*100',
};

/**
 * Built-in formula templates for Budget calculations
 */
export const BUDGET_FORMULA_TEMPLATES = {
  remainingBudget: '=totalBudget-allocatedBudget',
  utilizationPercent: '=allocatedBudget/totalBudget*100',
  targetValue: '=targetUnits*averagePrice',
  gmroiTarget: '=grossMargin/averageInventory',
};
