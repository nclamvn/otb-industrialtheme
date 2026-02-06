/**
 * Formula Builder for NL Formula Engine
 * Builds Excel formulas from detected intents
 */

import { DetectedIntent, IntentType } from './intent-detector';
import { FIELD_MAPPINGS } from './vietnamese-dictionary';

export interface FormulaResult {
  formula: string;
  isValid: boolean;
  description: string;
  variables: string[];
  warnings?: string[];
}

export interface BuildOptions {
  context?: Record<string, unknown>;
  preferCellReferences?: boolean;
  useVietnameseFieldNames?: boolean;
}

// Formula templates for each intent type
const FORMULA_TEMPLATES: Record<IntentType, {
  template: string;
  requiredFields: string[];
  description: string;
}> = {
  CALCULATE_MARGIN: {
    template: '=(${retailPrice}-${costPrice})/${retailPrice}*100',
    requiredFields: ['retailPrice', 'costPrice'],
    description: 'Tính margin % = (Giá bán - Giá vốn) / Giá bán × 100',
  },
  CALCULATE_TOTAL: {
    template: '=${quantity}*${retailPrice}',
    requiredFields: ['quantity', 'retailPrice'],
    description: 'Tính tổng giá trị = Số lượng × Giá bán',
  },
  CALCULATE_PROFIT: {
    template: '=${quantity}*(${retailPrice}-${costPrice})',
    requiredFields: ['quantity', 'retailPrice', 'costPrice'],
    description: 'Tính lợi nhuận = Số lượng × (Giá bán - Giá vốn)',
  },
  CALCULATE_MARKUP: {
    template: '=(${retailPrice}-${costPrice})/${costPrice}*100',
    requiredFields: ['retailPrice', 'costPrice'],
    description: 'Tính markup % = (Giá bán - Giá vốn) / Giá vốn × 100',
  },
  SUM_RANGE: {
    template: '=SUM(${range})',
    requiredFields: ['range'],
    description: 'Tính tổng dãy ô',
  },
  AVERAGE_RANGE: {
    template: '=AVERAGE(${range})',
    requiredFields: ['range'],
    description: 'Tính trung bình dãy ô',
  },
  COUNT_RANGE: {
    template: '=COUNT(${range})',
    requiredFields: ['range'],
    description: 'Đếm số ô có giá trị',
  },
  CONDITIONAL: {
    template: '=IF(${condition}, ${trueValue}, ${falseValue})',
    requiredFields: ['condition', 'trueValue', 'falseValue'],
    description: 'Công thức điều kiện',
  },
  COMPARE: {
    template: '=${field1}${operator}${field2}',
    requiredFields: ['field1', 'operator', 'field2'],
    description: 'So sánh hai giá trị',
  },
  LOOKUP: {
    template: '=VLOOKUP(${lookupValue}, ${tableRange}, ${columnIndex}, FALSE)',
    requiredFields: ['lookupValue', 'tableRange', 'columnIndex'],
    description: 'Tra cứu giá trị',
  },
  CUSTOM_FORMULA: {
    template: '=${expression}',
    requiredFields: ['expression'],
    description: 'Công thức tùy chỉnh',
  },
  UNKNOWN: {
    template: '',
    requiredFields: [],
    description: 'Không xác định được loại công thức',
  },
};

/**
 * Formula Builder Class
 */
export class FormulaBuilder {
  /**
   * Build formula from detected intent
   */
  build(intent: DetectedIntent, options: BuildOptions = {}): FormulaResult {
    const template = FORMULA_TEMPLATES[intent.type];
    const warnings: string[] = [];

    if (!template || !template.template) {
      return {
        formula: '',
        isValid: false,
        description: 'Không thể xây dựng công thức từ đầu vào này',
        variables: [],
        warnings: ['Loại intent không được hỗ trợ'],
      };
    }

    // Check for required fields
    const missingFields = this.findMissingFields(intent, template.requiredFields, options.context);

    if (missingFields.length > 0 && intent.type !== 'CUSTOM_FORMULA') {
      warnings.push(`Thiếu trường: ${missingFields.join(', ')}`);
    }

    // Build the formula
    let formula = template.template;
    const variables: string[] = [];

    // Replace field placeholders
    formula = this.replaceFieldPlaceholders(formula, intent, options, variables, warnings);

    // Replace range placeholders
    formula = this.replaceRangePlaceholders(formula, intent, options, variables);

    // Replace conditional placeholders
    formula = this.replaceConditionalPlaceholders(formula, intent, options, variables);

    // Clean up any remaining placeholders
    const remainingPlaceholders = formula.match(/\$\{[^}]+\}/g);
    if (remainingPlaceholders) {
      warnings.push(`Còn placeholder chưa thay thế: ${remainingPlaceholders.join(', ')}`);
    }

    // Validate formula syntax
    const isValid = this.validateFormulaSyntax(formula) && remainingPlaceholders === null;

    return {
      formula,
      isValid,
      description: template.description,
      variables,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Find missing required fields
   */
  private findMissingFields(
    intent: DetectedIntent,
    requiredFields: string[],
    context?: Record<string, unknown>
  ): string[] {
    const availableFields = new Set([
      ...intent.fields,
      ...(context ? Object.keys(context) : []),
    ]);

    return requiredFields.filter(field => {
      // Skip special fields that are built differently
      if (['range', 'condition', 'trueValue', 'falseValue', 'expression'].includes(field)) {
        return false;
      }
      return !availableFields.has(field);
    });
  }

  /**
   * Replace field placeholders in formula
   */
  private replaceFieldPlaceholders(
    formula: string,
    intent: DetectedIntent,
    options: BuildOptions,
    variables: string[],
    warnings: string[]
  ): string {
    // Standard field mappings
    const fieldMap: Record<string, string> = {
      retailPrice: 'retailPrice',
      costPrice: 'costPrice',
      quantity: 'quantity',
      margin: 'margin',
      profit: 'profit',
    };

    // If context provided, use actual values or cell references
    if (options.context) {
      for (const [key, value] of Object.entries(options.context)) {
        if (typeof value === 'number' || typeof value === 'string') {
          fieldMap[key] = options.preferCellReferences ? key : String(value);
        }
      }
    }

    // Replace each field placeholder
    for (const [field, replacement] of Object.entries(fieldMap)) {
      const placeholder = `\${${field}}`;
      if (formula.includes(placeholder)) {
        formula = formula.replace(new RegExp(`\\$\\{${field}\\}`, 'g'), replacement);
        variables.push(field);
      }
    }

    // Try to infer fields from detected intent fields
    const detectedFields = intent.fields;
    if (detectedFields.length >= 2) {
      // If we have retailPrice and costPrice in detected fields, use them
      if (detectedFields.includes('retailPrice')) {
        formula = formula.replace(/\$\{retailPrice\}/g, 'retailPrice');
        if (!variables.includes('retailPrice')) variables.push('retailPrice');
      }
      if (detectedFields.includes('costPrice')) {
        formula = formula.replace(/\$\{costPrice\}/g, 'costPrice');
        if (!variables.includes('costPrice')) variables.push('costPrice');
      }
      if (detectedFields.includes('quantity')) {
        formula = formula.replace(/\$\{quantity\}/g, 'quantity');
        if (!variables.includes('quantity')) variables.push('quantity');
      }
    }

    return formula;
  }

  /**
   * Replace range placeholders
   */
  private replaceRangePlaceholders(
    formula: string,
    intent: DetectedIntent,
    options: BuildOptions,
    variables: string[]
  ): string {
    // Check if there's a range in the intent
    if (formula.includes('${range}')) {
      // Try to find range from context or use field names
      if (intent.fields.length > 0) {
        const range = `${intent.fields[0]}:${intent.fields[0]}`;
        formula = formula.replace('${range}', range);
        variables.push(intent.fields[0]);
      } else if (options.context?.range) {
        formula = formula.replace('${range}', String(options.context.range));
      }
    }

    return formula;
  }

  /**
   * Replace conditional placeholders for IF formulas
   */
  private replaceConditionalPlaceholders(
    formula: string,
    intent: DetectedIntent,
    options: BuildOptions,
    variables: string[]
  ): string {
    if (intent.type !== 'CONDITIONAL') {
      return formula;
    }

    // Try to build condition from detected components
    const context = options.context || {};

    if (context.condition) {
      formula = formula.replace('${condition}', String(context.condition));
    }
    if (context.trueValue) {
      formula = formula.replace('${trueValue}', String(context.trueValue));
    }
    if (context.falseValue) {
      formula = formula.replace('${falseValue}', String(context.falseValue));
    }

    // Default condition components if not provided
    if (intent.fields.length > 0 && intent.numbers.length > 0) {
      const field = intent.fields[0];
      const value = intent.numbers[0];
      const condition = `${field}>=${value}`;

      if (formula.includes('${condition}')) {
        formula = formula.replace('${condition}', condition);
        variables.push(field);
      }
    }

    return formula;
  }

  /**
   * Validate formula syntax (basic check)
   */
  private validateFormulaSyntax(formula: string): boolean {
    if (!formula.startsWith('=')) {
      return false;
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of formula) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) return false;
    }
    if (parenCount !== 0) return false;

    // Check for common syntax errors
    if (formula.includes('//')) return false;
    if (formula.includes('**')) return false;
    if (/[+\-*/]$/.test(formula)) return false;

    return true;
  }

  /**
   * Build formula with cell references
   */
  buildWithCellReferences(
    intent: DetectedIntent,
    cellMap: Record<string, string>
  ): FormulaResult {
    const baseResult = this.build(intent, { preferCellReferences: true });

    if (!baseResult.isValid) {
      return baseResult;
    }

    let formula = baseResult.formula;

    // Replace field names with cell references
    for (const [fieldName, cellRef] of Object.entries(cellMap)) {
      formula = formula.replace(new RegExp(fieldName, 'g'), cellRef);
    }

    return {
      ...baseResult,
      formula,
    };
  }

  /**
   * Get formula template for intent type
   */
  getTemplate(intentType: IntentType): { template: string; description: string } | null {
    const template = FORMULA_TEMPLATES[intentType];
    return template
      ? { template: template.template, description: template.description }
      : null;
  }

  /**
   * List all available formula templates
   */
  listTemplates(): Array<{ type: IntentType; template: string; description: string }> {
    return Object.entries(FORMULA_TEMPLATES)
      .filter(([_, v]) => v.template !== '')
      .map(([type, v]) => ({
        type: type as IntentType,
        template: v.template,
        description: v.description,
      }));
  }
}

// Export singleton instance
export const formulaBuilder = new FormulaBuilder();
