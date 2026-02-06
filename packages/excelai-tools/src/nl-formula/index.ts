/**
 * NL Formula Engine
 * Main entry point for Vietnamese Natural Language to Excel Formula conversion
 */

export * from './vietnamese-dictionary';
export * from './tokenizer';
export * from './intent-detector';
export * from './formula-builder';

import { VietnameseTokenizer, TokenizerResult } from './tokenizer';
import { IntentDetector, DetectedIntent } from './intent-detector';
import { FormulaBuilder, FormulaResult, BuildOptions } from './formula-builder';

export interface NLFormulaResult {
  success: boolean;
  formula: string;
  intent: DetectedIntent;
  formulaResult: FormulaResult;
  alternativeIntents?: DetectedIntent[];
  executionTime: number;
}

export interface NLFormulaOptions extends BuildOptions {
  returnAlternatives?: boolean;
  maxAlternatives?: number;
}

/**
 * NL Formula Engine Class
 * Converts Vietnamese natural language to Excel formulas
 */
export class NLFormulaEngine {
  private tokenizer: VietnameseTokenizer;
  private intentDetector: IntentDetector;
  private formulaBuilder: FormulaBuilder;

  constructor() {
    this.tokenizer = new VietnameseTokenizer();
    this.intentDetector = new IntentDetector();
    this.formulaBuilder = new FormulaBuilder();
  }

  /**
   * Convert Vietnamese natural language to Excel formula
   */
  convert(input: string, options: NLFormulaOptions = {}): NLFormulaResult {
    const startTime = Date.now();

    // Step 1: Detect primary intent
    const intent = this.intentDetector.detect(input);

    // Step 2: Get alternative intents if requested
    let alternativeIntents: DetectedIntent[] | undefined;
    if (options.returnAlternatives) {
      const allIntents = this.intentDetector.detectAll(input);
      const maxAlts = options.maxAlternatives || 3;
      alternativeIntents = allIntents.slice(1, maxAlts + 1);
    }

    // Step 3: Build formula from primary intent
    const formulaResult = this.formulaBuilder.build(intent, options);

    const executionTime = Date.now() - startTime;

    return {
      success: formulaResult.isValid && intent.confidence >= 0.3,
      formula: formulaResult.formula,
      intent,
      formulaResult,
      alternativeIntents,
      executionTime,
    };
  }

  /**
   * Tokenize input without full conversion
   */
  tokenize(input: string): TokenizerResult {
    return this.tokenizer.tokenize(input);
  }

  /**
   * Detect intent without building formula
   */
  detectIntent(input: string): DetectedIntent {
    return this.intentDetector.detect(input);
  }

  /**
   * Get all possible intents for input
   */
  detectAllIntents(input: string): DetectedIntent[] {
    return this.intentDetector.detectAll(input);
  }

  /**
   * Build formula from intent
   */
  buildFormula(intent: DetectedIntent, options: BuildOptions = {}): FormulaResult {
    return this.formulaBuilder.build(intent, options);
  }

  /**
   * Quick convert - returns just the formula string
   */
  quickConvert(input: string, context?: Record<string, unknown>): string | null {
    const result = this.convert(input, { context });
    return result.success ? result.formula : null;
  }

  /**
   * Batch convert multiple inputs
   */
  batchConvert(
    inputs: string[],
    options: NLFormulaOptions = {}
  ): NLFormulaResult[] {
    return inputs.map(input => this.convert(input, options));
  }

  /**
   * Validate if input can be converted to a formula
   */
  canConvert(input: string): { canConvert: boolean; confidence: number; reason?: string } {
    const intent = this.intentDetector.detect(input);

    if (intent.type === 'UNKNOWN') {
      return {
        canConvert: false,
        confidence: 0,
        reason: 'Không nhận dạng được ý định từ đầu vào',
      };
    }

    if (intent.confidence < 0.3) {
      return {
        canConvert: false,
        confidence: intent.confidence,
        reason: 'Độ tin cậy thấp - đầu vào không rõ ràng',
      };
    }

    return {
      canConvert: true,
      confidence: intent.confidence,
    };
  }

  /**
   * Get available formula templates
   */
  getTemplates() {
    return this.formulaBuilder.listTemplates();
  }

  /**
   * Suggest formulas based on partial input
   */
  suggest(partialInput: string, limit: number = 5): Array<{
    formula: string;
    description: string;
    confidence: number;
  }> {
    const allIntents = this.intentDetector.detectAll(partialInput);

    return allIntents
      .slice(0, limit)
      .map(intent => {
        const formulaResult = this.formulaBuilder.build(intent);
        return {
          formula: formulaResult.formula,
          description: formulaResult.description,
          confidence: intent.confidence,
        };
      })
      .filter(s => s.formula && s.formula !== '=');
  }
}

// Export singleton instance
export const nlFormulaEngine = new NLFormulaEngine();

// Convenience function exports
export function convertToFormula(input: string, options?: NLFormulaOptions): NLFormulaResult {
  return nlFormulaEngine.convert(input, options);
}

export function quickConvert(input: string, context?: Record<string, unknown>): string | null {
  return nlFormulaEngine.quickConvert(input, context);
}
