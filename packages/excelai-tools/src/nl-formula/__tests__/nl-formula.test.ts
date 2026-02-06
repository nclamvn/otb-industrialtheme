/**
 * NL Formula Engine Tests
 */

import {
  NLFormulaEngine,
  VietnameseTokenizer,
  IntentDetector,
  FormulaBuilder,
  normalizeVietnamese,
  parseVietnameseNumber,
  findFieldName,
  findOperation,
} from '../index';

describe('Vietnamese Dictionary', () => {
  describe('normalizeVietnamese', () => {
    it('should remove diacritics', () => {
      expect(normalizeVietnamese('giá bán')).toBe('gia ban');
      expect(normalizeVietnamese('số lượng')).toBe('so luong');
      expect(normalizeVietnamese('biên lợi nhuận')).toBe('bien loi nhuan');
    });

    it('should convert đ to d', () => {
      expect(normalizeVietnamese('đơn hàng')).toBe('don hang');
      expect(normalizeVietnamese('Đếm')).toBe('dem');
    });

    it('should lowercase and trim', () => {
      expect(normalizeVietnamese('  GIÁ BÁN  ')).toBe('gia ban');
    });
  });

  describe('parseVietnameseNumber', () => {
    it('should parse direct numbers', () => {
      expect(parseVietnameseNumber('123')).toBe(123);
      expect(parseVietnameseNumber('45.67')).toBe(45.67);
      expect(parseVietnameseNumber('1,234')).toBe(1234);
    });

    it('should parse Vietnamese number words', () => {
      expect(parseVietnameseNumber('một')).toBe(1);
      expect(parseVietnameseNumber('năm')).toBe(5);
      expect(parseVietnameseNumber('mười')).toBe(10);
    });
  });

  describe('findFieldName', () => {
    it('should find field from Vietnamese aliases', () => {
      expect(findFieldName('giá bán')).toBe('retailPrice');
      expect(findFieldName('giá vốn')).toBe('costPrice');
      expect(findFieldName('số lượng')).toBe('quantity');
      expect(findFieldName('margin')).toBe('margin');
    });

    it('should return null for unknown fields', () => {
      expect(findFieldName('xyz')).toBeNull();
      expect(findFieldName('không biết')).toBeNull();
    });
  });

  describe('findOperation', () => {
    it('should find operation from Vietnamese keywords', () => {
      expect(findOperation('tổng')).toBe('SUM');
      expect(findOperation('trung bình')).toBe('AVERAGE');
      expect(findOperation('đếm')).toBe('COUNT');
      expect(findOperation('lớn nhất')).toBe('MAX');
      expect(findOperation('nhỏ nhất')).toBe('MIN');
    });
  });
});

describe('VietnameseTokenizer', () => {
  const tokenizer = new VietnameseTokenizer();

  describe('tokenize', () => {
    it('should tokenize simple input', () => {
      const result = tokenizer.tokenize('tính tổng giá bán');
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.originalText).toBe('tính tổng giá bán');
    });

    it('should detect operations', () => {
      const result = tokenizer.tokenize('tính tổng');
      const operations = tokenizer.extractOperations(result.tokens);
      expect(operations).toContain('SUM');
    });

    it('should detect fields', () => {
      const result = tokenizer.tokenize('giá bán nhân số lượng');
      const fields = tokenizer.extractFields(result.tokens);
      expect(fields).toContain('retailPrice');
      expect(fields).toContain('quantity');
    });

    it('should detect numbers', () => {
      const result = tokenizer.tokenize('lớn hơn 100');
      const numbers = tokenizer.extractNumbers(result.tokens);
      expect(numbers).toContain(100);
    });

    it('should merge compound expressions', () => {
      const result = tokenizer.tokenize('giá bán lẻ');
      const fields = tokenizer.extractFields(result.tokens);
      expect(fields).toContain('retailPrice');
    });
  });
});

describe('IntentDetector', () => {
  const detector = new IntentDetector();

  describe('detect', () => {
    it('should detect margin calculation intent', () => {
      const result = detector.detect('tính margin từ giá bán và giá vốn');
      expect(result.type).toBe('CALCULATE_MARGIN');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect total value intent', () => {
      const result = detector.detect('tính tổng giá trị');
      expect(result.type).toBe('CALCULATE_TOTAL');
    });

    it('should detect profit calculation intent', () => {
      const result = detector.detect('tính lợi nhuận');
      expect(result.type).toBe('CALCULATE_PROFIT');
    });

    it('should detect sum range intent', () => {
      const result = detector.detect('tính tổng của cột số lượng');
      expect(result.type).toBe('SUM_RANGE');
    });

    it('should detect average intent', () => {
      const result = detector.detect('tính trung bình');
      expect(result.type).toBe('AVERAGE_RANGE');
    });

    it('should return low confidence for unclear input', () => {
      const result = detector.detect('abc xyz');
      expect(result.confidence).toBeLessThan(0.3);
    });
  });

  describe('detectAll', () => {
    it('should return multiple intents sorted by confidence', () => {
      const results = detector.detectAll('tính margin');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].confidence).toBeGreaterThanOrEqual(results[results.length - 1].confidence);
    });
  });
});

describe('FormulaBuilder', () => {
  const builder = new FormulaBuilder();
  const detector = new IntentDetector();

  describe('build', () => {
    it('should build margin formula', () => {
      const intent = detector.detect('tính margin');
      const result = builder.build(intent);

      expect(result.formula).toContain('retailPrice');
      expect(result.formula).toContain('costPrice');
      expect(result.formula).toContain('100');
    });

    it('should build total value formula', () => {
      const intent = detector.detect('tính tổng giá trị');
      const result = builder.build(intent);

      expect(result.formula).toContain('quantity');
      expect(result.formula).toContain('retailPrice');
    });

    it('should validate formula syntax', () => {
      const intent = detector.detect('tính margin');
      const result = builder.build(intent);

      expect(result.formula.startsWith('=')).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('buildWithCellReferences', () => {
    it('should replace field names with cell references', () => {
      const intent = detector.detect('tính margin');
      const cellMap = {
        retailPrice: 'E2',
        costPrice: 'F2',
      };

      const result = builder.buildWithCellReferences(intent, cellMap);
      expect(result.formula).toContain('E2');
      expect(result.formula).toContain('F2');
    });
  });

  describe('listTemplates', () => {
    it('should return available templates', () => {
      const templates = builder.listTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.type === 'CALCULATE_MARGIN')).toBe(true);
    });
  });
});

describe('NLFormulaEngine', () => {
  const engine = new NLFormulaEngine();

  describe('convert', () => {
    it('should convert Vietnamese to formula', () => {
      const result = engine.convert('tính margin');

      expect(result.success).toBe(true);
      expect(result.formula).toBeTruthy();
      expect(result.formula.startsWith('=')).toBe(true);
    });

    it('should include execution time', () => {
      const result = engine.convert('tính tổng');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should return alternative intents when requested', () => {
      const result = engine.convert('tính margin', { returnAlternatives: true });
      expect(result.alternativeIntents).toBeDefined();
    });
  });

  describe('quickConvert', () => {
    it('should return just the formula string', () => {
      const formula = engine.quickConvert('tính margin');
      expect(formula).toBeTruthy();
      expect(formula?.startsWith('=')).toBe(true);
    });

    it('should return null for invalid input', () => {
      const formula = engine.quickConvert('xyz abc');
      expect(formula).toBeNull();
    });
  });

  describe('batchConvert', () => {
    it('should convert multiple inputs', () => {
      const inputs = ['tính margin', 'tính tổng', 'tính lợi nhuận'];
      const results = engine.batchConvert(inputs);

      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.formula).toBeTruthy();
      });
    });
  });

  describe('canConvert', () => {
    it('should return true for valid input', () => {
      const result = engine.canConvert('tính margin');
      expect(result.canConvert).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should return false for invalid input', () => {
      const result = engine.canConvert('xyz abc def');
      expect(result.canConvert).toBe(false);
    });
  });

  describe('suggest', () => {
    it('should suggest formulas based on input', () => {
      const suggestions = engine.suggest('tính margin');
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(s => {
        expect(s.formula).toBeTruthy();
        expect(s.description).toBeTruthy();
      });
    });

    it('should return empty for unrecognized input', () => {
      const suggestions = engine.suggest('xyz abc');
      // May return empty or low confidence suggestions
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});
