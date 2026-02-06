/**
 * Vietnamese Dictionary for NL Formula Engine
 * Maps Vietnamese phrases to Excel formula operations
 */

// Operation keywords mapping
export const OPERATION_KEYWORDS: Record<string, string[]> = {
  SUM: ['tổng', 'cộng', 'tổng cộng', 'tính tổng', 'cộng tất cả', 'tổng số'],
  AVERAGE: ['trung bình', 'tb', 'bình quân', 'trung bình cộng'],
  COUNT: ['đếm', 'số lượng', 'count', 'đếm số'],
  MAX: ['lớn nhất', 'max', 'cao nhất', 'tối đa', 'maximum'],
  MIN: ['nhỏ nhất', 'min', 'thấp nhất', 'tối thiểu', 'minimum'],
  IF: ['nếu', 'điều kiện', 'kiểm tra', 'nếu như'],
  VLOOKUP: ['tìm', 'tra cứu', 'lookup', 'tìm kiếm'],
  MULTIPLY: ['nhân', 'x', '*', 'lần'],
  DIVIDE: ['chia', '/', 'phần'],
  SUBTRACT: ['trừ', '-', 'hiệu'],
  ADD: ['cộng', '+', 'thêm'],
  PERCENTAGE: ['phần trăm', '%', 'tỷ lệ', 'percent'],
};

// Field name mappings (Vietnamese → standard field names)
export const FIELD_MAPPINGS: Record<string, string[]> = {
  retailPrice: [
    'giá bán',
    'giá retail',
    'retail price',
    'gia ban',
    'giá bán lẻ',
    'retail',
    'rrp',
    'giá niêm yết',
  ],
  costPrice: [
    'giá gốc',
    'giá vốn',
    'cost price',
    'gia goc',
    'giá nhập',
    'cost',
    'wholesale',
    'giá sỉ',
  ],
  quantity: [
    'số lượng',
    'qty',
    'quantity',
    'so luong',
    'sl',
    'đơn hàng',
    'order quantity',
  ],
  margin: [
    'margin',
    'biên lợi nhuận',
    'lợi nhuận',
    'bien loi nhuan',
    'tỷ suất lợi nhuận',
    'profit margin',
  ],
  totalValue: [
    'tổng giá trị',
    'total value',
    'tong gia tri',
    'giá trị đơn hàng',
    'value',
  ],
  profit: [
    'lợi nhuận',
    'profit',
    'loi nhuan',
    'tiền lời',
    'thu nhập',
  ],
  budget: [
    'ngân sách',
    'budget',
    'ngan sach',
    'kinh phí',
  ],
  allocation: [
    'phân bổ',
    'allocation',
    'phan bo',
    'chia',
  ],
};

// Common formula patterns
export const FORMULA_PATTERNS: Record<string, {
  pattern: RegExp;
  template: string;
  description: string;
}> = {
  margin: {
    pattern: /(?:tính|tìm|xác định)?\s*(?:margin|biên lợi nhuận|tỷ suất lợi nhuận)/i,
    template: '=(retailPrice-costPrice)/retailPrice*100',
    description: 'Tính margin từ giá bán và giá vốn',
  },
  totalValue: {
    pattern: /(?:tính|tìm)?\s*(?:tổng giá trị|total value|tổng tiền)/i,
    template: '=quantity*retailPrice',
    description: 'Tính tổng giá trị = số lượng x giá bán',
  },
  profit: {
    pattern: /(?:tính|tìm)?\s*(?:lợi nhuận|profit|tiền lời)/i,
    template: '=quantity*(retailPrice-costPrice)',
    description: 'Tính lợi nhuận = số lượng x (giá bán - giá vốn)',
  },
  markup: {
    pattern: /(?:tính|tìm)?\s*(?:markup|hệ số giá|tỷ lệ đánh giá)/i,
    template: '=(retailPrice-costPrice)/costPrice*100',
    description: 'Tính markup % từ giá vốn',
  },
  sumRange: {
    pattern: /(?:tính|tìm)?\s*(?:tổng|cộng)\s+(?:của\s+)?(?:cột\s+)?(\w+)/i,
    template: '=SUM({range})',
    description: 'Tính tổng một dãy ô',
  },
  averageRange: {
    pattern: /(?:tính|tìm)?\s*(?:trung bình|tb)\s+(?:của\s+)?(?:cột\s+)?(\w+)/i,
    template: '=AVERAGE({range})',
    description: 'Tính trung bình một dãy ô',
  },
  countRange: {
    pattern: /(?:đếm|count)\s+(?:số\s+)?(?:lượng\s+)?(?:của\s+)?(?:cột\s+)?(\w+)/i,
    template: '=COUNT({range})',
    description: 'Đếm số ô có giá trị số',
  },
};

// Comparison operators
export const COMPARISON_OPERATORS: Record<string, string[]> = {
  '>': ['lớn hơn', 'cao hơn', 'nhiều hơn', 'trên', '>', 'greater than'],
  '<': ['nhỏ hơn', 'thấp hơn', 'ít hơn', 'dưới', '<', 'less than'],
  '>=': ['lớn hơn hoặc bằng', 'từ', '>=', 'ít nhất'],
  '<=': ['nhỏ hơn hoặc bằng', 'đến', '<=', 'nhiều nhất'],
  '=': ['bằng', '=', 'là', 'equal'],
  '<>': ['khác', 'không bằng', '<>', 'khác với'],
};

// Logical operators
export const LOGICAL_OPERATORS: Record<string, string[]> = {
  AND: ['và', 'and', 'đồng thời', 'cùng với'],
  OR: ['hoặc', 'or', 'hay'],
  NOT: ['không', 'not', 'phủ định'],
};

// Vietnamese number words
export const NUMBER_WORDS: Record<string, number> = {
  'không': 0,
  'một': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4,
  'năm': 5,
  'sáu': 6,
  'bảy': 7,
  'tám': 8,
  'chín': 9,
  'mười': 10,
  'trăm': 100,
  'nghìn': 1000,
  'ngàn': 1000,
  'triệu': 1000000,
  'tỷ': 1000000000,
};

// Common SKU field synonyms
export const SKU_FIELD_SYNONYMS: Record<string, string[]> = {
  sku: ['sku', 'mã sku', 'ma sku', 'mã sản phẩm', 'product code'],
  styleName: ['tên', 'tên sản phẩm', 'ten san pham', 'style', 'mẫu'],
  category: ['danh mục', 'loại', 'category', 'danh muc', 'nhóm'],
  gender: ['giới tính', 'gioi tinh', 'gender', 'target'],
  color: ['màu', 'màu sắc', 'color', 'mau'],
  size: ['size', 'kích cỡ', 'cỡ', 'kich co'],
};

// Budget field synonyms
export const BUDGET_FIELD_SYNONYMS: Record<string, string[]> = {
  totalBudget: ['tổng ngân sách', 'total budget', 'ngân sách tổng', 'budget'],
  allocatedBudget: ['ngân sách đã phân bổ', 'allocated', 'đã phân bổ', 'đã sử dụng'],
  remainingBudget: ['ngân sách còn lại', 'remaining', 'còn lại', 'available'],
  targetUnits: ['mục tiêu đơn vị', 'target units', 'số lượng mục tiêu'],
};

/**
 * Normalize Vietnamese text (remove diacritics for matching)
 */
export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

/**
 * Find matching field name from Vietnamese input
 */
export function findFieldName(input: string): string | null {
  const normalized = normalizeVietnamese(input);

  for (const [fieldName, aliases] of Object.entries(FIELD_MAPPINGS)) {
    for (const alias of aliases) {
      if (normalizeVietnamese(alias) === normalized || alias.toLowerCase() === input.toLowerCase()) {
        return fieldName;
      }
    }
  }

  return null;
}

/**
 * Find matching operation from Vietnamese input
 */
export function findOperation(input: string): string | null {
  const normalized = normalizeVietnamese(input);

  for (const [operation, keywords] of Object.entries(OPERATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(normalizeVietnamese(keyword))) {
        return operation;
      }
    }
  }

  return null;
}

/**
 * Parse Vietnamese number expression
 */
export function parseVietnameseNumber(input: string): number | null {
  const normalized = input.toLowerCase().trim();

  // Try direct number parsing first
  const directNum = parseFloat(normalized.replace(/,/g, ''));
  if (!isNaN(directNum)) {
    return directNum;
  }

  // Try Vietnamese number words
  let result = 0;
  let current = 0;
  const words = normalized.split(/\s+/);

  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      const num = NUMBER_WORDS[word];
      if (num >= 100) {
        current = (current || 1) * num;
      } else if (num >= 10) {
        current = current * 10 + num;
      } else {
        current += num;
      }
    } else if (word === 'lẻ' || word === 'linh') {
      // Vietnamese for "and" in numbers, continue
      continue;
    }
  }

  result += current;
  return result > 0 ? result : null;
}

/**
 * Extract comparison operator from Vietnamese text
 */
export function extractComparison(input: string): { operator: string; value: string } | null {
  const normalized = input.toLowerCase();

  for (const [operator, keywords] of Object.entries(COMPARISON_OPERATORS)) {
    for (const keyword of keywords) {
      const index = normalized.indexOf(keyword.toLowerCase());
      if (index !== -1) {
        const afterKeyword = input.slice(index + keyword.length).trim();
        const valueMatch = afterKeyword.match(/^[\d.,]+/);
        if (valueMatch) {
          return { operator, value: valueMatch[0] };
        }
      }
    }
  }

  return null;
}
