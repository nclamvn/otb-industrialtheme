/**
 * Vietnamese Tokenizer for NL Formula Engine
 * Parses Vietnamese natural language input into tokens
 */

import {
  OPERATION_KEYWORDS,
  FIELD_MAPPINGS,
  COMPARISON_OPERATORS,
  LOGICAL_OPERATORS,
  normalizeVietnamese,
  parseVietnameseNumber,
} from './vietnamese-dictionary';

export type TokenType =
  | 'OPERATION'
  | 'FIELD'
  | 'NUMBER'
  | 'COMPARISON'
  | 'LOGICAL'
  | 'RANGE'
  | 'TEXT'
  | 'PUNCTUATION'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  normalized: string;
  position: number;
  length: number;
  metadata?: {
    operation?: string;
    fieldName?: string;
    numericValue?: number;
    operator?: string;
  };
}

export interface TokenizerResult {
  tokens: Token[];
  originalText: string;
  normalizedText: string;
}

/**
 * Vietnamese Tokenizer Class
 */
export class VietnameseTokenizer {
  /**
   * Tokenize Vietnamese natural language input
   */
  tokenize(input: string): TokenizerResult {
    const tokens: Token[] = [];
    const normalizedText = normalizeVietnamese(input);
    let position = 0;

    // Split into words while preserving punctuation
    const words = this.splitIntoWords(input);

    for (const word of words) {
      if (word.trim() === '') {
        position += word.length;
        continue;
      }

      const token = this.classifyToken(word, position);
      tokens.push(token);
      position += word.length + 1; // +1 for space
    }

    // Merge adjacent tokens that form compound expressions
    const mergedTokens = this.mergeCompoundTokens(tokens);

    return {
      tokens: mergedTokens,
      originalText: input,
      normalizedText,
    };
  }

  /**
   * Split input into words, keeping punctuation separate
   */
  private splitIntoWords(input: string): string[] {
    return input
      .replace(/([.,;:!?()])/g, ' $1 ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Classify a single token
   */
  private classifyToken(word: string, position: number): Token {
    const normalized = normalizeVietnamese(word);

    // Check if it's a number
    const numValue = parseVietnameseNumber(word);
    if (numValue !== null) {
      return {
        type: 'NUMBER',
        value: word,
        normalized,
        position,
        length: word.length,
        metadata: { numericValue: numValue },
      };
    }

    // Check if it's an operation keyword
    for (const [operation, keywords] of Object.entries(OPERATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalized === normalizeVietnamese(keyword) || word.toLowerCase() === keyword.toLowerCase()) {
          return {
            type: 'OPERATION',
            value: word,
            normalized,
            position,
            length: word.length,
            metadata: { operation },
          };
        }
      }
    }

    // Check if it's a field name
    for (const [fieldName, aliases] of Object.entries(FIELD_MAPPINGS)) {
      for (const alias of aliases) {
        if (normalized === normalizeVietnamese(alias) || word.toLowerCase() === alias.toLowerCase()) {
          return {
            type: 'FIELD',
            value: word,
            normalized,
            position,
            length: word.length,
            metadata: { fieldName },
          };
        }
      }
    }

    // Check if it's a comparison operator
    for (const [operator, keywords] of Object.entries(COMPARISON_OPERATORS)) {
      for (const keyword of keywords) {
        if (normalized === normalizeVietnamese(keyword) || word.toLowerCase() === keyword.toLowerCase()) {
          return {
            type: 'COMPARISON',
            value: word,
            normalized,
            position,
            length: word.length,
            metadata: { operator },
          };
        }
      }
    }

    // Check if it's a logical operator
    for (const [operator, keywords] of Object.entries(LOGICAL_OPERATORS)) {
      for (const keyword of keywords) {
        if (normalized === normalizeVietnamese(keyword) || word.toLowerCase() === keyword.toLowerCase()) {
          return {
            type: 'LOGICAL',
            value: word,
            normalized,
            position,
            length: word.length,
            metadata: { operator },
          };
        }
      }
    }

    // Check if it's a cell range (e.g., A1:B10)
    if (/^[A-Z]+\d+:[A-Z]+\d+$/i.test(word)) {
      return {
        type: 'RANGE',
        value: word,
        normalized: word.toUpperCase(),
        position,
        length: word.length,
      };
    }

    // Check if it's punctuation
    if (/^[.,;:!?()]$/.test(word)) {
      return {
        type: 'PUNCTUATION',
        value: word,
        normalized: word,
        position,
        length: word.length,
      };
    }

    // Unknown token (could be text or unrecognized)
    return {
      type: 'TEXT',
      value: word,
      normalized,
      position,
      length: word.length,
    };
  }

  /**
   * Merge adjacent tokens that form compound expressions
   * e.g., "giá" + "bán" -> "giá bán" (retailPrice)
   */
  private mergeCompoundTokens(tokens: Token[]): Token[] {
    const result: Token[] = [];
    let i = 0;

    while (i < tokens.length) {
      // Try to merge 2-word compounds
      if (i < tokens.length - 1) {
        const compound2 = `${tokens[i].value} ${tokens[i + 1].value}`;
        const compound2Token = this.tryMergeAsField(compound2, tokens[i].position);

        if (compound2Token) {
          result.push(compound2Token);
          i += 2;
          continue;
        }
      }

      // Try to merge 3-word compounds
      if (i < tokens.length - 2) {
        const compound3 = `${tokens[i].value} ${tokens[i + 1].value} ${tokens[i + 2].value}`;
        const compound3Token = this.tryMergeAsField(compound3, tokens[i].position);

        if (compound3Token) {
          result.push(compound3Token);
          i += 3;
          continue;
        }
      }

      result.push(tokens[i]);
      i++;
    }

    return result;
  }

  /**
   * Try to merge words as a compound field name
   */
  private tryMergeAsField(compound: string, position: number): Token | null {
    const normalized = normalizeVietnamese(compound);

    for (const [fieldName, aliases] of Object.entries(FIELD_MAPPINGS)) {
      for (const alias of aliases) {
        if (normalized === normalizeVietnamese(alias) || compound.toLowerCase() === alias.toLowerCase()) {
          return {
            type: 'FIELD',
            value: compound,
            normalized,
            position,
            length: compound.length,
            metadata: { fieldName },
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract all field references from tokens
   */
  extractFields(tokens: Token[]): string[] {
    return tokens
      .filter(t => t.type === 'FIELD' && t.metadata?.fieldName)
      .map(t => t.metadata!.fieldName!);
  }

  /**
   * Extract all operations from tokens
   */
  extractOperations(tokens: Token[]): string[] {
    return tokens
      .filter(t => t.type === 'OPERATION' && t.metadata?.operation)
      .map(t => t.metadata!.operation!);
  }

  /**
   * Extract all numbers from tokens
   */
  extractNumbers(tokens: Token[]): number[] {
    return tokens
      .filter(t => t.type === 'NUMBER' && t.metadata?.numericValue !== undefined)
      .map(t => t.metadata!.numericValue!);
  }
}

// Export singleton instance
export const tokenizer = new VietnameseTokenizer();
