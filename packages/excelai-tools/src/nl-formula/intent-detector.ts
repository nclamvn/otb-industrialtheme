/**
 * Intent Detector for NL Formula Engine
 * Detects user intent from Vietnamese natural language input
 */

import { VietnameseTokenizer, Token, TokenizerResult } from './tokenizer';
import { FORMULA_PATTERNS, normalizeVietnamese } from './vietnamese-dictionary';

export type IntentType =
  | 'CALCULATE_MARGIN'
  | 'CALCULATE_TOTAL'
  | 'CALCULATE_PROFIT'
  | 'CALCULATE_MARKUP'
  | 'SUM_RANGE'
  | 'AVERAGE_RANGE'
  | 'COUNT_RANGE'
  | 'CONDITIONAL'
  | 'COMPARE'
  | 'LOOKUP'
  | 'CUSTOM_FORMULA'
  | 'UNKNOWN';

export interface DetectedIntent {
  type: IntentType;
  confidence: number; // 0-1
  fields: string[];
  operations: string[];
  numbers: number[];
  rawInput: string;
  suggestedFormula?: string;
  description?: string;
}

export interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
  requiredTokens?: { type: string; count?: number }[];
  formulaTemplate: string;
  description: string;
}

// Intent patterns with regex and required tokens
const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: 'CALCULATE_MARGIN',
    patterns: [
      /(?:tính|tìm|xác định)?\s*(?:margin|biên lợi nhuận|tỷ suất lợi nhuận|biên)/i,
      /margin\s*(?:của|cho|với)?/i,
      /(?:giá bán|retail).*(?:giá vốn|cost).*(?:margin|lợi nhuận)/i,
    ],
    requiredTokens: [{ type: 'FIELD', count: 2 }],
    formulaTemplate: '=(retailPrice-costPrice)/retailPrice*100',
    description: 'Tính margin % = (Giá bán - Giá vốn) / Giá bán × 100',
  },
  {
    type: 'CALCULATE_TOTAL',
    patterns: [
      /(?:tính|tìm)?\s*(?:tổng giá trị|total value|tổng tiền|giá trị)/i,
      /(?:số lượng|quantity).*(?:nhân|×|x|\*).*(?:giá|price)/i,
      /(?:giá|price).*(?:nhân|×|x|\*).*(?:số lượng|quantity)/i,
    ],
    formulaTemplate: '=quantity*retailPrice',
    description: 'Tính tổng giá trị = Số lượng × Giá bán',
  },
  {
    type: 'CALCULATE_PROFIT',
    patterns: [
      /(?:tính|tìm)?\s*(?:lợi nhuận|profit|tiền lời|lãi)/i,
      /(?:doanh thu|revenue).*(?:trừ|-).*(?:chi phí|cost)/i,
    ],
    formulaTemplate: '=quantity*(retailPrice-costPrice)',
    description: 'Tính lợi nhuận = Số lượng × (Giá bán - Giá vốn)',
  },
  {
    type: 'CALCULATE_MARKUP',
    patterns: [
      /(?:tính|tìm)?\s*(?:markup|hệ số giá|tỷ lệ đánh giá|tỷ lệ markup)/i,
      /(?:giá bán|retail).*(?:so với|trên).*(?:giá vốn|cost)/i,
    ],
    formulaTemplate: '=(retailPrice-costPrice)/costPrice*100',
    description: 'Tính markup % = (Giá bán - Giá vốn) / Giá vốn × 100',
  },
  {
    type: 'SUM_RANGE',
    patterns: [
      /(?:tính|tìm)?\s*(?:tổng|cộng|sum)\s+(?:của\s+)?(?:cột\s+)?/i,
      /(?:cộng|tổng)\s+(?:tất cả|hết)/i,
    ],
    formulaTemplate: '=SUM({range})',
    description: 'Tính tổng một dãy ô',
  },
  {
    type: 'AVERAGE_RANGE',
    patterns: [
      /(?:tính|tìm)?\s*(?:trung bình|tb|average|bình quân)\s+(?:của\s+)?/i,
      /(?:giá trị\s+)?trung bình/i,
    ],
    formulaTemplate: '=AVERAGE({range})',
    description: 'Tính trung bình một dãy ô',
  },
  {
    type: 'COUNT_RANGE',
    patterns: [
      /(?:đếm|count)\s+(?:số\s+)?(?:lượng\s+)?/i,
      /(?:có\s+)?bao nhiêu/i,
    ],
    formulaTemplate: '=COUNT({range})',
    description: 'Đếm số ô có giá trị',
  },
  {
    type: 'CONDITIONAL',
    patterns: [
      /(?:nếu|if)\s+/i,
      /(?:khi|when)\s+.*(?:thì|then)/i,
      /(?:điều kiện|condition)/i,
    ],
    formulaTemplate: '=IF({condition}, {true_value}, {false_value})',
    description: 'Công thức điều kiện IF',
  },
  {
    type: 'COMPARE',
    patterns: [
      /(?:so sánh|compare)/i,
      /(?:lớn hơn|nhỏ hơn|bằng|khác)/i,
    ],
    formulaTemplate: '={field1}{operator}{field2}',
    description: 'So sánh hai giá trị',
  },
  {
    type: 'LOOKUP',
    patterns: [
      /(?:tìm|tra cứu|lookup|tìm kiếm)\s+/i,
      /(?:vlookup|hlookup)/i,
    ],
    formulaTemplate: '=VLOOKUP({value}, {range}, {column}, FALSE)',
    description: 'Tra cứu giá trị trong bảng',
  },
];

/**
 * Intent Detector Class
 */
export class IntentDetector {
  private tokenizer: VietnameseTokenizer;

  constructor() {
    this.tokenizer = new VietnameseTokenizer();
  }

  /**
   * Detect intent from Vietnamese natural language input
   */
  detect(input: string): DetectedIntent {
    const tokenizerResult = this.tokenizer.tokenize(input);
    const normalizedInput = normalizeVietnamese(input);

    // Extract components from tokens
    const fields = this.tokenizer.extractFields(tokenizerResult.tokens);
    const operations = this.tokenizer.extractOperations(tokenizerResult.tokens);
    const numbers = this.tokenizer.extractNumbers(tokenizerResult.tokens);

    // Find best matching intent
    let bestMatch: { pattern: IntentPattern; confidence: number } | null = null;

    for (const pattern of INTENT_PATTERNS) {
      const confidence = this.calculateConfidence(input, normalizedInput, pattern, tokenizerResult);

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { pattern, confidence };
      }
    }

    // If no good match found, try custom formula detection
    if (!bestMatch || bestMatch.confidence < 0.3) {
      return this.detectCustomFormula(input, fields, operations, numbers);
    }

    return {
      type: bestMatch.pattern.type,
      confidence: bestMatch.confidence,
      fields,
      operations,
      numbers,
      rawInput: input,
      suggestedFormula: this.buildFormula(bestMatch.pattern, fields, numbers),
      description: bestMatch.pattern.description,
    };
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private calculateConfidence(
    input: string,
    normalizedInput: string,
    pattern: IntentPattern,
    tokenizerResult: TokenizerResult
  ): number {
    let score = 0;
    let matchCount = 0;

    // Check regex pattern matches
    for (const regex of pattern.patterns) {
      if (regex.test(input) || regex.test(normalizedInput)) {
        matchCount++;
        score += 0.4;
      }
    }

    if (matchCount === 0) {
      return 0;
    }

    // Check required tokens
    if (pattern.requiredTokens) {
      for (const req of pattern.requiredTokens) {
        const tokensOfType = tokenizerResult.tokens.filter(t => t.type === req.type);
        const count = req.count || 1;

        if (tokensOfType.length >= count) {
          score += 0.2;
        }
      }
    }

    // Bonus for having relevant fields
    const fields = this.tokenizer.extractFields(tokenizerResult.tokens);
    if (fields.length > 0) {
      score += 0.2;
    }

    // Normalize score to 0-1 range
    return Math.min(score, 1);
  }

  /**
   * Build formula from pattern and detected values
   */
  private buildFormula(pattern: IntentPattern, fields: string[], numbers: number[]): string {
    let formula = pattern.formulaTemplate;

    // Replace field placeholders
    if (fields.includes('retailPrice') || fields.includes('costPrice')) {
      // Use detected fields
    }

    // Replace range placeholders if we have fields
    if (formula.includes('{range}') && fields.length > 0) {
      formula = formula.replace('{range}', `${fields[0]}:${fields[0]}`);
    }

    // Replace number placeholders
    if (numbers.length > 0) {
      formula = formula.replace('{value}', numbers[0].toString());
    }

    return formula;
  }

  /**
   * Detect custom formula when no pattern matches
   */
  private detectCustomFormula(
    input: string,
    fields: string[],
    operations: string[],
    numbers: number[]
  ): DetectedIntent {
    let suggestedFormula = '=';
    let confidence = 0.2;

    // Try to build a formula from detected components
    if (operations.length > 0 && fields.length > 0) {
      const op = operations[0];

      switch (op) {
        case 'SUM':
          suggestedFormula = `=SUM(${fields.join(', ')})`;
          confidence = 0.5;
          break;
        case 'AVERAGE':
          suggestedFormula = `=AVERAGE(${fields.join(', ')})`;
          confidence = 0.5;
          break;
        case 'MULTIPLY':
          suggestedFormula = `=${fields.join('*')}`;
          confidence = 0.5;
          break;
        case 'ADD':
          suggestedFormula = `=${fields.join('+')}`;
          confidence = 0.5;
          break;
        case 'SUBTRACT':
          suggestedFormula = `=${fields.join('-')}`;
          confidence = 0.5;
          break;
        case 'DIVIDE':
          suggestedFormula = `=${fields.join('/')}`;
          confidence = 0.5;
          break;
        default:
          suggestedFormula = `=${op}(${fields.join(', ')})`;
          confidence = 0.4;
      }
    }

    return {
      type: 'CUSTOM_FORMULA',
      confidence,
      fields,
      operations,
      numbers,
      rawInput: input,
      suggestedFormula: suggestedFormula !== '=' ? suggestedFormula : undefined,
      description: 'Công thức tùy chỉnh',
    };
  }

  /**
   * Get all possible intents for an input (ranked by confidence)
   */
  detectAll(input: string): DetectedIntent[] {
    const tokenizerResult = this.tokenizer.tokenize(input);
    const normalizedInput = normalizeVietnamese(input);
    const fields = this.tokenizer.extractFields(tokenizerResult.tokens);
    const operations = this.tokenizer.extractOperations(tokenizerResult.tokens);
    const numbers = this.tokenizer.extractNumbers(tokenizerResult.tokens);

    const results: DetectedIntent[] = [];

    for (const pattern of INTENT_PATTERNS) {
      const confidence = this.calculateConfidence(input, normalizedInput, pattern, tokenizerResult);

      if (confidence > 0.1) {
        results.push({
          type: pattern.type,
          confidence,
          fields,
          operations,
          numbers,
          rawInput: input,
          suggestedFormula: this.buildFormula(pattern, fields, numbers),
          description: pattern.description,
        });
      }
    }

    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}

// Export singleton instance
export const intentDetector = new IntentDetector();
