import { Injectable } from '@nestjs/common';
import {
  Parser,
  FormulaEvaluator,
  createSimpleContext,
  FormulaError,
  type FormulaValue,
} from '@dafc/excelai-core';

/**
 * Formula evaluation context data
 * Keys are cell references (A1, B2) or named variables
 */
export type FormulaContextData = Record<string, FormulaValue>;

/**
 * Result of formula evaluation
 */
export interface FormulaResult {
  success: boolean;
  value: FormulaValue;
  error?: string;
  formula: string;
}

/**
 * Batch evaluation result
 */
export interface BatchFormulaResult {
  results: FormulaResult[];
  successCount: number;
  errorCount: number;
}

/**
 * Formula detection result
 */
export interface DetectedFormula {
  cell: string;
  formula: string;
  row: number;
  col: number;
}

@Injectable()
export class FormulasService {
  private parser: Parser;
  private evaluator: FormulaEvaluator;

  constructor() {
    this.parser = new Parser();
    this.evaluator = new FormulaEvaluator();
  }

  /**
   * Evaluate a single formula with context
   */
  evaluate(formula: string, contextData: FormulaContextData = {}): FormulaResult {
    try {
      // Ensure formula starts with =
      const normalizedFormula = formula.startsWith('=') ? formula : `=${formula}`;

      // Parse the formula
      const ast = this.parser.parse(normalizedFormula);

      // Create evaluation context
      const context = createSimpleContext(contextData);

      // Evaluate
      const value = this.evaluator.evaluate(ast, context);

      // Check for formula errors
      if (value instanceof FormulaError) {
        return {
          success: false,
          value: null,
          error: value.type,
          formula: normalizedFormula,
        };
      }

      return {
        success: true,
        value,
        formula: normalizedFormula,
      };
    } catch (error) {
      return {
        success: false,
        value: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        formula,
      };
    }
  }

  /**
   * Evaluate multiple formulas with shared context
   */
  evaluateBatch(
    formulas: string[],
    contextData: FormulaContextData = {},
  ): BatchFormulaResult {
    const results = formulas.map((formula) => this.evaluate(formula, contextData));

    return {
      results,
      successCount: results.filter((r) => r.success).length,
      errorCount: results.filter((r) => !r.success).length,
    };
  }

  /**
   * Check if a string is a formula (starts with =)
   */
  isFormula(value: unknown): boolean {
    return typeof value === 'string' && value.trim().startsWith('=');
  }

  /**
   * Detect formulas in a data object
   * Scans all values and returns list of detected formulas
   */
  detectFormulas(data: Record<string, unknown>): DetectedFormula[] {
    const formulas: DetectedFormula[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (this.isFormula(value)) {
        // Try to parse cell reference from key (e.g., "A1", "B2")
        const cellMatch = key.match(/^([A-Z]+)(\d+)$/i);

        formulas.push({
          cell: key,
          formula: value as string,
          row: cellMatch ? parseInt(cellMatch[2]) - 1 : 0,
          col: cellMatch ? this.letterToCol(cellMatch[1]) : 0,
        });
      }
    }

    return formulas;
  }

  /**
   * Process data object, evaluating all formulas
   * Returns new object with formulas replaced by computed values
   */
  processDataWithFormulas(data: Record<string, unknown>): Record<string, FormulaValue> {
    const result: Record<string, FormulaValue> = {};
    const contextData: FormulaContextData = {};

    // First pass: collect non-formula values for context
    for (const [key, value] of Object.entries(data)) {
      if (!this.isFormula(value)) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        contextData[key] = isNaN(numValue as number) ? value as FormulaValue : numValue as number;
        result[key] = contextData[key];
      }
    }

    // Second pass: evaluate formulas
    for (const [key, value] of Object.entries(data)) {
      if (this.isFormula(value)) {
        const evalResult = this.evaluate(value as string, contextData);
        result[key] = evalResult.success ? evalResult.value : null;

        // Add computed value to context for dependent formulas
        if (evalResult.success && evalResult.value !== null) {
          contextData[key] = evalResult.value;
        }
      }
    }

    return result;
  }

  /**
   * Create a calculation context for SKU data
   */
  createSKUContext(sku: {
    retailPrice?: number;
    costPrice?: number;
    orderQuantity?: number;
    sizeBreakdown?: Record<string, number>;
    [key: string]: unknown;
  }): FormulaContextData {
    const context: FormulaContextData = {};

    // Map SKU fields to cell references
    if (sku.retailPrice !== undefined) {
      context['retailPrice'] = sku.retailPrice;
      context['A1'] = sku.retailPrice; // Also as cell ref
    }
    if (sku.costPrice !== undefined) {
      context['costPrice'] = sku.costPrice;
      context['B1'] = sku.costPrice;
    }
    if (sku.orderQuantity !== undefined) {
      context['orderQuantity'] = sku.orderQuantity;
      context['C1'] = sku.orderQuantity;
    }

    // Add size breakdown values
    if (sku.sizeBreakdown) {
      let col = 3; // Start from D
      for (const [size, qty] of Object.entries(sku.sizeBreakdown)) {
        context[size] = qty;
        context[this.colToLetter(col) + '1'] = qty;
        col++;
      }
    }

    // Add any other numeric fields
    for (const [key, value] of Object.entries(sku)) {
      if (typeof value === 'number' && !(key in context)) {
        context[key] = value;
      }
    }

    return context;
  }

  /**
   * Create a calculation context for Budget data
   */
  createBudgetContext(budget: {
    totalBudget?: number;
    seasonalBudget?: number;
    replenishmentBudget?: number;
    allocatedBudget?: number;
    targetUnits?: number;
    targetGMROI?: number;
    [key: string]: unknown;
  }): FormulaContextData {
    const context: FormulaContextData = {};

    // Map budget fields
    if (budget.totalBudget !== undefined) {
      context['totalBudget'] = budget.totalBudget;
      context['A1'] = budget.totalBudget;
    }
    if (budget.seasonalBudget !== undefined) {
      context['seasonalBudget'] = budget.seasonalBudget;
      context['B1'] = budget.seasonalBudget;
    }
    if (budget.replenishmentBudget !== undefined) {
      context['replenishmentBudget'] = budget.replenishmentBudget;
      context['C1'] = budget.replenishmentBudget;
    }
    if (budget.allocatedBudget !== undefined) {
      context['allocatedBudget'] = budget.allocatedBudget;
      context['D1'] = budget.allocatedBudget;
    }
    if (budget.targetUnits !== undefined) {
      context['targetUnits'] = budget.targetUnits;
      context['E1'] = budget.targetUnits;
    }
    if (budget.targetGMROI !== undefined) {
      context['targetGMROI'] = budget.targetGMROI;
      context['F1'] = budget.targetGMROI;
    }

    // Add any other numeric fields
    for (const [key, value] of Object.entries(budget)) {
      if (typeof value === 'number' && !(key in context)) {
        context[key] = value;
      }
    }

    return context;
  }

  /**
   * Calculate margin from retail and cost prices
   */
  calculateMargin(retailPrice: number, costPrice: number): number {
    const result = this.evaluate('=(retailPrice-costPrice)/retailPrice*100', {
      retailPrice,
      costPrice,
    });
    return result.success ? (result.value as number) : 0;
  }

  /**
   * Calculate remaining budget
   */
  calculateRemainingBudget(totalBudget: number, allocatedBudget: number): number {
    const result = this.evaluate('=totalBudget-allocatedBudget', {
      totalBudget,
      allocatedBudget,
    });
    return result.success ? (result.value as number) : 0;
  }

  // Helper: Convert column letter to number (A=0, B=1, ...)
  private letterToCol(letter: string): number {
    let result = 0;
    for (const c of letter.toUpperCase()) {
      result = result * 26 + (c.charCodeAt(0) - 64);
    }
    return result - 1;
  }

  // Helper: Convert column number to letter
  private colToLetter(col: number): string {
    let result = '';
    let n = col + 1;
    while (n > 0) {
      n -= 1;
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26);
    }
    return result;
  }
}
