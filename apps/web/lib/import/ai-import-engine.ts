// ═══════════════════════════════════════════════════════════════════════════════
// AI Import Engine — Intelligent Column Mapping, Validation & Transformation
// DAFC OTB Platform — Legacy Data Migration System
// ═══════════════════════════════════════════════════════════════════════════════

import {
  type ImportTarget,
  type PlatformField,
  type AIColumnMapping,
  type DataTransform,
  type ValidationIssue,
  type ValidationSummary,
  type ValidationSeverity,
  TARGET_SCHEMAS,
} from '@/types/import';

// ─── String Similarity (Levenshtein-based) ───────────────────────────────────

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese diacritics
    .replace(/[_\-\s.()]+/g, ' ')    // replace separators with space
    .replace(/\s+/g, ' ')            // collapse multiple spaces
    .trim();
}

// Check if header contains the alias as a word
function containsWord(header: string, alias: string): boolean {
  const h = normalizeStr(header);
  const a = normalizeStr(alias);
  // Exact word match or header starts/ends with alias
  const words = h.split(' ');
  const aliasWords = a.split(' ');

  // Check if all alias words appear in header words
  return aliasWords.every(aw => words.some(w => w === aw || w.startsWith(aw) || w.endsWith(aw)));
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const na = normalizeStr(a);
  const nb = normalizeStr(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(na, nb) / maxLen;
}

// ─── AI Column Mapping ───────────────────────────────────────────────────────

export function aiAutoMapColumns(
  sourceHeaders: string[],
  target: ImportTarget,
  sampleData: Record<string, unknown>[]
): AIColumnMapping[] {
  const schema = TARGET_SCHEMAS[target];
  const mappings: AIColumnMapping[] = [];
  const usedTargets = new Set<string>();

  // Sort by required fields first (they get priority)
  const sortedSchema = [...schema].sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));

  for (const header of sourceHeaders) {
    const candidates: Array<{
      field: PlatformField;
      score: number;
      reason: string;
      reasonVi: string;
      method: string;
    }> = [];

    for (const field of sortedSchema) {
      let bestScore = 0;
      let bestReason = '';
      let bestReasonVi = '';
      let method = '';

      // Method 1: Exact match with field id/label
      const exactScores = [
        similarity(header, field.id),
        similarity(header, field.label),
        similarity(header, field.labelVi),
      ];
      const exactMax = Math.max(...exactScores);
      if (exactMax > bestScore) {
        bestScore = exactMax;
        method = 'exact';
        if (exactMax >= 0.95) {
          bestReason = `Exact match with "${field.label}"`;
          bestReasonVi = `Khớp chính xác với "${field.labelVi}"`;
        } else {
          bestReason = `Similar to "${field.label}"`;
          bestReasonVi = `Tương tự với "${field.labelVi}"`;
        }
      }

      // Method 2: Alias matching (improved)
      for (const alias of field.aliases) {
        // Direct similarity check
        let aliasScore = similarity(header, alias);

        // Bonus: if header contains alias as exact word(s), give high confidence
        if (containsWord(header, alias)) {
          aliasScore = Math.max(aliasScore, 0.9);
        }

        // Bonus: if normalized versions are equal, perfect match
        if (normalizeStr(header) === normalizeStr(alias)) {
          aliasScore = 1.0;
        }

        if (aliasScore > bestScore) {
          bestScore = aliasScore;
          method = 'alias';
          bestReason = `Matched alias "${alias}" for "${field.label}"`;
          bestReasonVi = `Khớp với tên thay thế "${alias}" của "${field.labelVi}"`;
        }
      }

      // Method 3: Data type inference from sample data
      if (bestScore < 0.5 && sampleData.length > 0) {
        const typeScore = inferTypeMatch(header, field, sampleData);
        if (typeScore > bestScore) {
          bestScore = typeScore;
          method = 'type_inference';
          bestReason = `Data pattern matches ${field.type} field "${field.label}"`;
          bestReasonVi = `Dữ liệu phù hợp với kiểu ${field.type} của "${field.labelVi}"`;
        }
      }

      if (bestScore > 0.3) {
        candidates.push({ field, score: bestScore, reason: bestReason, reasonVi: bestReasonVi, method });
      }
    }

    // Sort candidates by score
    candidates.sort((a, b) => b.score - a.score);

    // Pick best non-conflicting match
    const best = candidates.find((c) => !usedTargets.has(c.field.id));
    const alternatives = candidates
      .filter((c) => c !== best && !usedTargets.has(c.field.id))
      .slice(0, 3)
      .map((c) => ({
        targetField: c.field.id,
        confidence: c.score,
        reason: c.reasonVi,
      }));

    if (best && best.score >= 0.35) {
      usedTargets.add(best.field.id);
      mappings.push({
        sourceColumn: header,
        targetField: best.field.id,
        confidence: best.score,
        aiReason: best.reasonVi,
        alternatives,
        transform: suggestTransform(header, best.field, sampleData),
      });
    } else {
      mappings.push({
        sourceColumn: header,
        targetField: null,
        confidence: 0,
        aiReason: 'Không tìm thấy trường phù hợp. Vui lòng chọn thủ công.',
        alternatives: candidates.slice(0, 3).map((c) => ({
          targetField: c.field.id,
          confidence: c.score,
          reason: c.reasonVi,
        })),
      });
    }
  }

  return mappings;
}

// ─── Type Inference from Sample Data ─────────────────────────────────────────

function inferTypeMatch(
  header: string,
  field: PlatformField,
  sampleData: Record<string, unknown>[]
): number {
  const values = sampleData.map((row) => row[header]).filter((v) => v != null);
  if (values.length === 0) return 0;

  const allNumeric = values.every((v) => !isNaN(Number(String(v).replace(/[,.\s₫VND%]/g, ''))));
  const allDates = values.every((v) => isLikeDate(String(v)));
  const allPercent = values.every((v) => String(v).includes('%') || (Number(v) >= 0 && Number(v) <= 1));

  switch (field.type) {
    case 'currency':
      if (allNumeric && values.some((v) => String(v).match(/[₫VND$€]|\.000|,000/))) return 0.55;
      if (allNumeric) return 0.35;
      return 0;
    case 'number':
      return allNumeric ? 0.4 : 0;
    case 'percent':
      return allPercent ? 0.5 : 0;
    case 'date':
      return allDates ? 0.6 : 0;
    case 'boolean':
      const boolValues = values.map((v) => String(v).toLowerCase());
      const isBool = boolValues.every((v) =>
        ['true', 'false', '1', '0', 'yes', 'no', 'có', 'không', 'x', ''].includes(v)
      );
      return isBool ? 0.6 : 0;
    default:
      return 0.2;
  }
}

function isLikeDate(value: string): boolean {
  return /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}/.test(value) ||
         /\d{2}\/\d{2}\/\d{4}/.test(value) ||
         !isNaN(Date.parse(value));
}

// ─── Transform Suggestions ───────────────────────────────────────────────────

function suggestTransform(
  header: string,
  field: PlatformField,
  sampleData: Record<string, unknown>[]
): DataTransform | undefined {
  const values = sampleData.map((r) => r[header]).filter((v) => v != null).map(String);
  if (values.length === 0) return undefined;

  // Date format detection
  if (field.type === 'date') {
    const sample = values[0];
    if (/\d{2}\/\d{2}\/\d{4}/.test(sample)) {
      return {
        type: 'date_format',
        params: { from: 'DD/MM/YYYY', to: 'YYYY-MM-DD' },
        description: 'Convert DD/MM/YYYY to ISO format',
        descriptionVi: 'Chuyển đổi DD/MM/YYYY sang định dạng ISO',
      };
    }
  }

  // Currency parsing
  if (field.type === 'currency') {
    const hasVND = values.some((v) => v.match(/[₫VND]/));
    const usesCommaDecimal = values.some((v) => /\d+\.\d{3}/.test(v)); // 1.000.000 format
    if (hasVND || usesCommaDecimal) {
      return {
        type: 'currency_parse',
        params: {
          removeCurrencySymbol: true,
          decimalSeparator: usesCommaDecimal ? ',' : '.',
          thousandsSeparator: usesCommaDecimal ? '.' : ',',
        },
        description: 'Parse Vietnamese currency format',
        descriptionVi: 'Chuyển đổi định dạng tiền tệ Việt Nam',
      };
    }
  }

  // Percentage cleanup
  if (field.type === 'percent' && values.some((v) => v.includes('%'))) {
    return {
      type: 'number_parse',
      params: { removeSymbol: '%', divideBy: values.some((v) => Number(v.replace('%', '')) > 1) ? 1 : 100 },
      description: 'Remove % symbol and normalize',
      descriptionVi: 'Loại bỏ ký hiệu % và chuẩn hóa',
    };
  }

  // Text cleanup
  if (field.type === 'text' && values.some((v) => v !== v.trim() || /\s{2,}/.test(v))) {
    return {
      type: 'text_clean',
      params: { trim: true, collapseWhitespace: true },
      description: 'Trim whitespace and collapse multiple spaces',
      descriptionVi: 'Dọn dẹp khoảng trắng thừa',
    };
  }

  return undefined;
}

// ─── Data Validation ─────────────────────────────────────────────────────────

export function validateImportData(
  data: Record<string, unknown>[],
  mappings: AIColumnMapping[],
  target: ImportTarget
): { summary: ValidationSummary; issues: ValidationIssue[] } {
  const schema = TARGET_SCHEMAS[target];
  const issues: ValidationIssue[] = [];
  const fieldMap = new Map(schema.map((f) => [f.id, f]));
  const activeMappings = mappings.filter((m) => m.targetField);
  const mappedFields = new Set(activeMappings.map((m) => m.targetField!));

  // Check for unmapped required fields
  const missingRequired = schema
    .filter((f) => f.required && !mappedFields.has(f.id))
    .map((f) => f.labelVi);

  let issueId = 0;

  // Row-by-row validation
  const rowErrors = new Set<number>();
  const rowWarnings = new Set<number>();
  const seenValues = new Map<string, Set<string>>();

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    for (const mapping of activeMappings) {
      if (!mapping.targetField) continue;
      const field = fieldMap.get(mapping.targetField);
      if (!field) continue;

      const value = row[mapping.sourceColumn];
      const strValue = value == null ? '' : String(value).trim();

      // Required field missing
      if (field.required && (!value || strValue === '')) {
        issues.push({
          id: `issue_${++issueId}`,
          row: rowIdx + 1,
          column: mapping.sourceColumn,
          field: field.labelVi,
          severity: 'error',
          message: `Required field "${field.label}" is empty`,
          messageVi: `Trường bắt buộc "${field.labelVi}" đang trống`,
          currentValue: value,
          suggestedAction: 'Provide a value or skip this row',
          suggestedActionVi: 'Nhập giá trị hoặc bỏ qua dòng này',
          autoFixable: false,
          category: 'missing',
        });
        rowErrors.add(rowIdx);
        continue;
      }

      if (!value || strValue === '') continue;

      // Type validation
      if (field.type === 'number' || field.type === 'currency' || field.type === 'percent') {
        const cleanNum = strValue.replace(/[₫VND$€%,\s]/g, '').replace(/\./g, '');
        if (isNaN(Number(cleanNum)) && cleanNum !== '') {
          const suggestedNum = strValue.replace(/[^\d.\-]/g, '');
          issues.push({
            id: `issue_${++issueId}`,
            row: rowIdx + 1,
            column: mapping.sourceColumn,
            field: field.labelVi,
            severity: 'error',
            message: `"${strValue}" is not a valid number`,
            messageVi: `"${strValue}" không phải là số hợp lệ`,
            currentValue: value,
            suggestedValue: suggestedNum || undefined,
            suggestedActionVi: suggestedNum ? `AI gợi ý: chuyển thành "${suggestedNum}"` : 'Kiểm tra và sửa giá trị',
            autoFixable: !!suggestedNum,
            category: 'invalid_type',
          });
          rowErrors.add(rowIdx);
        } else if (field.validation) {
          const num = Number(cleanNum);
          if (field.validation.min !== undefined && num < field.validation.min) {
            issues.push({
              id: `issue_${++issueId}`,
              row: rowIdx + 1, column: mapping.sourceColumn, field: field.labelVi,
              severity: 'warning',
              message: `Value ${num} is below minimum ${field.validation.min}`,
              messageVi: `Giá trị ${num} thấp hơn mức tối thiểu ${field.validation.min}`,
              currentValue: value, suggestedValue: field.validation.min,
              autoFixable: true, category: 'out_of_range',
            });
            rowWarnings.add(rowIdx);
          }
          if (field.validation.max !== undefined && num > field.validation.max) {
            issues.push({
              id: `issue_${++issueId}`,
              row: rowIdx + 1, column: mapping.sourceColumn, field: field.labelVi,
              severity: 'warning',
              message: `Value ${num} exceeds maximum ${field.validation.max}`,
              messageVi: `Giá trị ${num} vượt quá mức tối đa ${field.validation.max}`,
              currentValue: value, suggestedValue: field.validation.max,
              autoFixable: true, category: 'out_of_range',
            });
            rowWarnings.add(rowIdx);
          }
        }
      }

      // Select field: validate against options
      if (field.type === 'select' && field.options) {
        const normalized = normalizeStr(strValue);
        const match = field.options.find((o) => normalizeStr(o) === normalized);
        if (!match) {
          const closest = field.options
            .map((o) => ({ option: o, score: similarity(strValue, o) }))
            .sort((a, b) => b.score - a.score)[0];

          issues.push({
            id: `issue_${++issueId}`,
            row: rowIdx + 1, column: mapping.sourceColumn, field: field.labelVi,
            severity: closest?.score > 0.6 ? 'warning' : 'error',
            message: `"${strValue}" is not a valid option`,
            messageVi: `"${strValue}" không nằm trong danh sách cho phép`,
            currentValue: value,
            suggestedValue: closest?.score > 0.5 ? closest.option : undefined,
            suggestedActionVi: closest?.score > 0.5
              ? `AI gợi ý: đổi thành "${closest.option}" (${(closest.score * 100).toFixed(0)}% phù hợp)`
              : `Các giá trị hợp lệ: ${field.options.join(', ')}`,
            autoFixable: closest?.score > 0.6,
            category: 'format_mismatch',
          });
          if (closest?.score > 0.6) rowWarnings.add(rowIdx); else rowErrors.add(rowIdx);
        }
      }

      // Duplicate detection for key fields
      if (field.required && (field.id === 'sku' || field.id === 'code')) {
        if (!seenValues.has(field.id)) seenValues.set(field.id, new Set());
        const seen = seenValues.get(field.id)!;
        if (seen.has(strValue)) {
          issues.push({
            id: `issue_${++issueId}`,
            row: rowIdx + 1, column: mapping.sourceColumn, field: field.labelVi,
            severity: 'warning',
            message: `Duplicate value "${strValue}"`,
            messageVi: `Giá trị trùng lặp "${strValue}"`,
            currentValue: value,
            suggestedActionVi: 'Kiểm tra xem có muốn ghi đè hay bỏ qua',
            autoFixable: false, category: 'duplicate',
          });
          rowWarnings.add(rowIdx);
        }
        seen.add(strValue);
      }
    }
  }

  // Anomaly detection: statistical outliers for numeric fields
  for (const mapping of activeMappings) {
    if (!mapping.targetField) continue;
    const field = fieldMap.get(mapping.targetField);
    if (!field || (field.type !== 'number' && field.type !== 'currency')) continue;

    const numValues = data
      .map((r, i) => ({ val: Number(String(r[mapping.sourceColumn] || '0').replace(/[^\d.\-]/g, '')), row: i }))
      .filter((v) => !isNaN(v.val));

    if (numValues.length < 5) continue;

    const sorted = [...numValues].sort((a, b) => a.val - b.val);
    const q1 = sorted[Math.floor(numValues.length * 0.25)].val;
    const q3 = sorted[Math.floor(numValues.length * 0.75)].val;
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    for (const { val, row } of numValues) {
      if (val < lowerBound || val > upperBound) {
        issues.push({
          id: `issue_${++issueId}`,
          row: row + 1, column: mapping.sourceColumn, field: field.labelVi,
          severity: 'info',
          message: `Potential outlier: ${val} (expected range: ${lowerBound.toFixed(0)}–${upperBound.toFixed(0)})`,
          messageVi: `Giá trị bất thường: ${val} (khoảng dự kiến: ${lowerBound.toFixed(0)}–${upperBound.toFixed(0)})`,
          currentValue: val,
          suggestedActionVi: 'AI phát hiện giá trị ngoại lệ — vui lòng kiểm tra lại',
          autoFixable: false, category: 'anomaly',
        });
      }
    }
  }

  // Build summary
  const issuesByCategory: Record<string, number> = {};
  const issuesBySeverity: Record<ValidationSeverity, number> = { error: 0, warning: 0, info: 0, suggestion: 0 };

  for (const issue of issues) {
    issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
    issuesBySeverity[issue.severity]++;
  }

  const validRows = data.length - rowErrors.size;
  const qualityScore = Math.max(0, Math.round(
    100 * (1 - (rowErrors.size * 2 + rowWarnings.size * 0.5) / Math.max(data.length, 1))
  ));

  // AI Insights
  const aiInsightsVi: string[] = [];
  if (missingRequired.length > 0) {
    aiInsightsVi.push(`⚠️ Thiếu ${missingRequired.length} trường bắt buộc chưa được mapping: ${missingRequired.join(', ')}`);
  }
  if (issuesBySeverity.error === 0) {
    aiInsightsVi.push('✅ Không phát hiện lỗi nghiêm trọng nào trong dữ liệu');
  }
  if (issuesByCategory['duplicate'] > 0) {
    aiInsightsVi.push(`🔄 Phát hiện ${issuesByCategory['duplicate']} giá trị trùng lặp — kiểm tra cấu hình xử lý trùng`);
  }
  if (issuesByCategory['anomaly'] > 0) {
    aiInsightsVi.push(`📊 AI phát hiện ${issuesByCategory['anomaly']} giá trị ngoại lệ — nên kiểm tra lại dữ liệu gốc`);
  }
  const autoFixCount = issues.filter((i) => i.autoFixable).length;
  if (autoFixCount > 0) {
    aiInsightsVi.push(`🤖 AI có thể tự động sửa ${autoFixCount} vấn đề — bật "Auto-fix" để áp dụng`);
  }
  if (qualityScore >= 90) {
    aiInsightsVi.push('🌟 Chất lượng dữ liệu tổng thể: Xuất sắc — sẵn sàng import');
  } else if (qualityScore >= 70) {
    aiInsightsVi.push('👍 Chất lượng dữ liệu tổng thể: Tốt — nên xem lại các cảnh báo trước khi import');
  } else {
    aiInsightsVi.push('⚠️ Chất lượng dữ liệu tổng thể: Cần cải thiện — vui lòng sửa các lỗi trước khi import');
  }

  return {
    summary: {
      totalRows: data.length,
      validRows,
      errorRows: rowErrors.size,
      warningRows: rowWarnings.size,
      issuesByCategory,
      issuesBySeverity,
      autoFixableCount: autoFixCount,
      score: qualityScore,
      aiInsights: aiInsightsVi,
      aiInsightsVi,
    },
    issues,
  };
}

// ─── Apply Auto-Fixes ────────────────────────────────────────────────────────

export function applyAutoFixes(
  data: Record<string, unknown>[],
  issues: ValidationIssue[],
  mappings: AIColumnMapping[]
): { fixedData: Record<string, unknown>[]; fixedCount: number } {
  const fixedData = data.map((row) => ({ ...row }));
  let fixedCount = 0;

  for (const issue of issues) {
    if (!issue.autoFixable || issue.suggestedValue === undefined) continue;
    const rowIdx = issue.row - 1;
    if (rowIdx < 0 || rowIdx >= fixedData.length) continue;

    fixedData[rowIdx][issue.column] = issue.suggestedValue;
    fixedCount++;
  }

  return { fixedData, fixedCount };
}

// ─── Transform Data ──────────────────────────────────────────────────────────

export function transformData(
  data: Record<string, unknown>[],
  mappings: AIColumnMapping[]
): Record<string, unknown>[] {
  return data.map((row) => {
    const transformed: Record<string, unknown> = {};

    for (const mapping of mappings) {
      if (!mapping.targetField) continue;
      let value = row[mapping.sourceColumn];

      if (mapping.transform && value != null) {
        value = applyTransform(value, mapping.transform);
      }

      transformed[mapping.targetField] = value;
    }

    return transformed;
  });
}

function applyTransform(value: unknown, transform: DataTransform): unknown {
  const str = String(value);

  switch (transform.type) {
    case 'currency_parse': {
      const { removeCurrencySymbol, decimalSeparator, thousandsSeparator } = transform.params as {
        removeCurrencySymbol: boolean; decimalSeparator: string; thousandsSeparator: string;
      };
      let clean = str;
      if (removeCurrencySymbol) clean = clean.replace(/[₫VND$€\s]/gi, '');
      if (thousandsSeparator === '.') clean = clean.replace(/\./g, '');
      if (decimalSeparator === ',') clean = clean.replace(',', '.');
      return Number(clean) || 0;
    }

    case 'date_format': {
      const { from } = transform.params as { from: string };
      if (from === 'DD/MM/YYYY') {
        const parts = str.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return str;
    }

    case 'number_parse': {
      const { removeSymbol, divideBy } = transform.params as { removeSymbol?: string; divideBy?: number };
      let clean = str;
      if (removeSymbol) clean = clean.replace(new RegExp(removeSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      const num = Number(clean.replace(/[,\s]/g, ''));
      return divideBy ? num / divideBy : num;
    }

    case 'text_clean': {
      const { trim, collapseWhitespace } = transform.params as { trim?: boolean; collapseWhitespace?: boolean };
      let clean = str;
      if (trim) clean = clean.trim();
      if (collapseWhitespace) clean = clean.replace(/\s+/g, ' ');
      return clean;
    }

    default:
      return value;
  }
}

// ─── Generate Import Preview ─────────────────────────────────────────────────

export function generatePreview(
  data: Record<string, unknown>[],
  mappings: AIColumnMapping[],
  maxRows = 20
): { original: Record<string, unknown>[]; transformed: Record<string, unknown>[] } {
  const slice = data.slice(0, maxRows);
  return {
    original: slice,
    transformed: transformData(slice, mappings),
  };
}
