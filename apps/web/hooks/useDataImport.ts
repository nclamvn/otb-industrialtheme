'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// useDataImport (v2) — REAL API Integration
// DAFC OTB Platform — Now sends data to /api/v1/import/batch for persistence
//
// CHANGES FROM v1:
//   ✅ startImport() now calls POST /api/v1/import/batch per batch
//   ✅ Real inserted/updated/skipped/errors from server response
//   ✅ sessionId tracking for undo/delete capability
//   ✅ Error handling with server-side validation
//   ❌ Removed: Math.random() simulation
//   ❌ Removed: fake setTimeout delays
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import type {
  ImportTarget,
  ImportFile,
  ImportConfig,
  AIColumnMapping,
  ValidationIssue,
  ValidationSummary,
  ImportProgress,
  ImportStep,
} from '@/types/import';
import {
  aiAutoMapColumns,
  validateImportData,
  applyAutoFixes,
  transformData,
  generatePreview,
} from '@/lib/import/ai-import-engine';

// ─── Hook Interface ──────────────────────────────────────────────────────────

interface UseDataImportReturn {
  step: ImportStep;
  file: ImportFile | null;
  config: ImportConfig;
  mappings: AIColumnMapping[];
  validation: ValidationSummary | null;
  issues: ValidationIssue[];
  progress: ImportProgress;
  previewData: { original: Record<string, unknown>[]; transformed: Record<string, unknown>[] };
  isProcessing: boolean;
  error: string | null;
  lastSessionId: string | null;

  setTarget: (target: ImportTarget) => void;
  uploadFile: (file: File) => Promise<void>;
  setSelectedSheet: (sheet: string) => void;
  updateMapping: (sourceColumn: string, targetField: string | null) => void;
  rerunAIMapping: () => void;
  runValidation: () => void;
  applyAutoFixAll: () => void;
  dismissIssue: (issueId: string) => void;
  updateConfig: (updates: Partial<ImportConfig>) => void;
  startImport: () => Promise<void>;
  cancelImport: () => void;
  goToStep: (step: ImportStep) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: ImportConfig = {
  target: 'products',
  mode: 'upsert',
  duplicateHandling: 'skip',
  matchKey: ['sku'],
  batchSize: 100,
  skipEmptyRows: true,
  trimWhitespace: true,
  autoFixEnabled: true,
  dateFormat: 'DD/MM/YYYY',
  currencyCode: 'VND',
  decimalSeparator: ',',
  thousandsSeparator: '.',
};

const INITIAL_PROGRESS: ImportProgress = {
  status: 'idle', step: 'upload', currentRow: 0, totalRows: 0, percent: 0,
  insertedCount: 0, updatedCount: 0, skippedCount: 0, errorCount: 0,
  startTime: 0, message: '', messageVi: '',
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDataImport(): UseDataImportReturn {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<ImportFile | null>(null);
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [config, setConfig] = useState<ImportConfig>(DEFAULT_CONFIG);
  const [mappings, setMappings] = useState<AIColumnMapping[]>([]);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [previewData, setPreviewData] = useState<{
    original: Record<string, unknown>[];
    transformed: Record<string, unknown>[];
  }>({ original: [], transformed: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress>(INITIAL_PROGRESS);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  const cancelRef = useRef(false);

  // ─── Target ──────────────────────────────────────────────────────

  const setTarget = useCallback((target: ImportTarget) => {
    setConfig((prev) => ({ ...prev, target }));
  }, []);

  // ─── Upload & Parse (supports Excel, CSV, SQL) ───────────────────

  const uploadFile = useCallback(async (inputFile: File) => {
    setIsProcessing(true);
    setError(null);
    setProgress((p) => ({ ...p, status: 'uploading', messageVi: 'Đang tải file...' }));

    try {
      await new Promise((r) => setTimeout(r, 300));
      setProgress((p) => ({ ...p, status: 'parsing', messageVi: 'Đang phân tích file...' }));

      let headers: string[] = [];
      let rows: Record<string, unknown>[] = [];
      let delimiter = ',';
      const isExcel = inputFile.name.endsWith('.xlsx') || inputFile.name.endsWith('.xls');
      const isSql = inputFile.name.endsWith('.sql');

      if (isExcel) {
        // Parse Excel file using xlsx library
        const arrayBuffer = await inputFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
          raw: false, // Get formatted strings instead of raw values
        });

        if (jsonData.length > 0) {
          // Filter out empty columns (__EMPTY, __EMPTY_1, etc.) and columns with no useful data
          const allHeaders = Object.keys(jsonData[0]);
          const validHeaders = allHeaders.filter(h => {
            // Skip columns that look like empty placeholders
            if (/^__EMPTY(_\d+)?$/.test(h)) return false;
            if (h.trim() === '' || h.trim() === '-') return false;

            // Check if column has any non-empty values
            const hasData = jsonData.some(row => {
              const val = row[h];
              return val != null && String(val).trim() !== '' && String(val).trim() !== '-';
            });
            return hasData;
          });

          headers = validHeaders;
          // Create cleaned rows with only valid headers
          rows = jsonData.map(row => {
            const cleanedRow: Record<string, unknown> = {};
            for (const h of validHeaders) {
              cleanedRow[h] = row[h];
            }
            return cleanedRow;
          });
        }
      } else if (isSql) {
        // Parse SQL INSERT statements
        const text = await inputFile.text();

        // Helper function to parse values from a VALUES clause
        const parseValues = (valuesStr: string): string[] => {
          const values: string[] = [];
          let current = '';
          let inQuote = false;
          let quoteChar = '';
          let depth = 0;

          for (let i = 0; i < valuesStr.length; i++) {
            const char = valuesStr[i];
            if (!inQuote && (char === "'" || char === '"')) {
              inQuote = true;
              quoteChar = char;
              current += char;
            } else if (inQuote && char === quoteChar) {
              current += char;
              if (valuesStr[i + 1] === quoteChar) {
                current += valuesStr[i + 1];
                i++;
              } else {
                inQuote = false;
              }
            } else if (!inQuote && char === '(') {
              depth++;
              if (depth > 1) current += char;
            } else if (!inQuote && char === ')') {
              depth--;
              if (depth > 0) current += char;
            } else if (!inQuote && char === ',' && depth === 1) {
              const val = current.trim().replace(/^['"]|['"]$/g, '');
              values.push(val === 'NULL' ? '' : val);
              current = '';
            } else if (depth >= 1) {
              current += char;
            }
          }
          if (current.trim()) {
            const val = current.trim().replace(/^['"]|['"]$/g, '');
            values.push(val === 'NULL' ? '' : val);
          }
          return values;
        };

        // Normalize whitespace and remove comments
        const cleanSql = text
          .replace(/--.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\r\n/g, '\n')
          .replace(/\n+/g, ' ')
          .trim();

        // Find all INSERT statements
        const insertPattern = /INSERT\s+INTO\s+[`"']?[\w.]+[`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?)(?=;|INSERT|$)/gi;
        let match;

        while ((match = insertPattern.exec(cleanSql)) !== null) {
          const columnsStr = match[1];
          const valuesStr = match[2];

          // Parse column names
          if (headers.length === 0) {
            headers = columnsStr
              .split(',')
              .map(c => c.trim().replace(/^[`"']|[`"']$/g, ''));
          }

          // Handle multiple VALUES rows: (v1,v2), (v1,v2), ...
          const valueGroups = valuesStr.split(/\)\s*,\s*\(/);
          for (let group of valueGroups) {
            if (!group.startsWith('(')) group = '(' + group;
            if (!group.endsWith(')')) group = group + ')';

            const values = parseValues(group);
            if (values.length > 0) {
              const row: Record<string, unknown> = {};
              headers.forEach((h, idx) => {
                row[h] = values[idx] ?? '';
              });
              rows.push(row);
            }
          }
        }

        if (headers.length === 0 || rows.length === 0) {
          throw new Error('Không tìm thấy câu lệnh INSERT hợp lệ trong file SQL.');
        }
      } else {
        // Parse CSV/TSV file
        const text = await inputFile.text();
        const lines = text.split('\n').filter((l) => l.trim());
        delimiter = text.includes('\t') ? '\t' : ',';
        headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
          const row: Record<string, unknown> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });
          rows.push(row);
        }
      }

      const importFile: ImportFile = {
        name: inputFile.name,
        size: inputFile.size,
        type: inputFile.type || (inputFile.name.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        headers,
        sampleRows: rows.slice(0, 10),
        totalRows: rows.length,
        delimiter,
      };

      setFile(importFile);
      setRawData(rows);

      // AI Auto-Map
      setProgress((p) => ({ ...p, status: 'ai_analyzing', messageVi: '🤖 AI đang phân tích cấu trúc dữ liệu...' }));
      await new Promise((r) => setTimeout(r, 800));

      const autoMappings = aiAutoMapColumns(headers, config.target, rows.slice(0, 10));
      setMappings(autoMappings);

      setStep('mapping');
      setProgress((p) => ({ ...p, status: 'mapping', messageVi: 'AI đã hoàn tất phân tích — vui lòng kiểm tra mapping' }));
    } catch (err) {
      setError(`Lỗi đọc file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setProgress((p) => ({ ...p, status: 'error', messageVi: 'Có lỗi khi đọc file' }));
    } finally {
      setIsProcessing(false);
    }
  }, [config.target]);

  const setSelectedSheet = useCallback((sheet: string) => {
    setFile((prev) => prev ? { ...prev, selectedSheet: sheet } : prev);
  }, []);

  // ─── Mapping ─────────────────────────────────────────────────────

  const updateMapping = useCallback((sourceColumn: string, targetField: string | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField, confidence: targetField ? 1 : 0, userOverride: true, aiReason: 'Đã chọn thủ công' }
          : m
      )
    );
  }, []);

  const rerunAIMapping = useCallback(() => {
    if (!file) return;
    const autoMappings = aiAutoMapColumns(file.headers, config.target, file.sampleRows);
    setMappings(autoMappings);
  }, [file, config.target]);

  // ─── Validation ──────────────────────────────────────────────────

  const runValidation = useCallback(() => {
    setIsProcessing(true);
    setProgress((p) => ({ ...p, status: 'validating', messageVi: '🤖 AI đang kiểm tra chất lượng dữ liệu...' }));

    setTimeout(() => {
      const result = validateImportData(rawData, mappings, config.target);
      setValidation(result.summary);
      setIssues(result.issues);
      setPreviewData(generatePreview(rawData, mappings, 20));
      setStep('preview');
      setProgress((p) => ({ ...p, status: 'previewing', messageVi: 'Kiểm tra hoàn tất — xem kết quả bên dưới' }));
      setIsProcessing(false);
    }, 400);
  }, [rawData, mappings, config.target]);

  // ─── Auto-Fix ────────────────────────────────────────────────────

  const applyAutoFixAll = useCallback(() => {
    const { fixedData, fixedCount } = applyAutoFixes(rawData, issues, mappings);
    setRawData(fixedData);
    const result = validateImportData(fixedData, mappings, config.target);
    setValidation(result.summary);
    setIssues(result.issues);
    setPreviewData(generatePreview(fixedData, mappings, 20));
    setProgress((p) => ({ ...p, messageVi: `🤖 AI đã tự động sửa ${fixedCount} vấn đề` }));
  }, [rawData, issues, mappings, config.target]);

  const dismissIssue = useCallback((issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
  }, []);

  const updateConfig = useCallback((updates: Partial<ImportConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // startImport — NOW CALLS REAL API
  // ═══════════════════════════════════════════════════════════════════

  const startImport = useCallback(async () => {
    cancelRef.current = false;
    setStep('importing');

    const transformedRows = transformData(rawData, mappings);
    const totalRows = transformedRows.length;
    const batchSize = config.batchSize;
    const totalBatches = Math.ceil(totalRows / batchSize);
    const startTime = Date.now();
    const sessionId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    setLastSessionId(sessionId);
    setProgress({
      status: 'importing', step: 'importing',
      currentRow: 0, totalRows, percent: 0,
      insertedCount: 0, updatedCount: 0, skippedCount: 0, errorCount: 0,
      startTime, currentBatch: 0, totalBatches,
      message: 'Importing...', messageVi: 'Đang import dữ liệu vào hệ thống...',
    });

    let totalInserted = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0;

    for (let batch = 0; batch < totalBatches; batch++) {
      if (cancelRef.current) break;

      const start = batch * batchSize;
      const end = Math.min(start + batchSize, totalRows);
      const batchRows = transformedRows.slice(start, end);

      try {
        // ─── REAL API CALL ──────────────────────────────────────
        const response = await fetch('/api/v1/import/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: config.target,
            mode: config.mode,
            duplicateHandling: config.duplicateHandling,
            matchKey: config.matchKey,
            rows: batchRows,
            batchIndex: batch,
            totalBatches,
            sessionId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        // ─── Accumulate REAL results from server ────────────────
        totalInserted += data.inserted || 0;
        totalUpdated += data.updated || 0;
        totalSkipped += data.skipped || 0;
        totalErrors += data.errors || 0;

      } catch (err) {
        // If API call fails, count entire batch as error
        totalErrors += batchRows.length;
        console.error(`[Import Batch ${batch + 1}/${totalBatches}]`, err);
      }

      const rowsProcessed = end;
      const elapsed = (Date.now() - startTime) / 1000;
      const rowsPerSec = rowsProcessed / Math.max(elapsed, 0.1);
      const remaining = Math.round((totalRows - rowsProcessed) / rowsPerSec);

      setProgress({
        status: cancelRef.current ? 'cancelled' : 'importing',
        step: 'importing',
        currentRow: rowsProcessed,
        totalRows,
        percent: Math.round((rowsProcessed / totalRows) * 100),
        insertedCount: totalInserted,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        errorCount: totalErrors,
        startTime,
        currentBatch: batch + 1,
        totalBatches,
        estimatedTimeRemaining: remaining,
        message: `Batch ${batch + 1}/${totalBatches}`,
        messageVi: `Đang xử lý lô ${batch + 1}/${totalBatches}...`,
      });
    }

    if (!cancelRef.current) {
      setProgress((p) => ({
        ...p,
        status: 'complete',
        step: 'complete',
        percent: 100,
        currentRow: totalRows,
        messageVi: `✅ Hoàn tất! ${totalInserted} thêm mới, ${totalUpdated} cập nhật, ${totalSkipped} bỏ qua, ${totalErrors} lỗi`,
      }));
      setStep('complete');
    }
  }, [rawData, mappings, config]);

  // ─── Cancel ──────────────────────────────────────────────────────

  const cancelImport = useCallback(() => {
    cancelRef.current = true;
    setProgress((p) => ({ ...p, status: 'cancelled', messageVi: 'Import đã bị hủy' }));
  }, []);

  const goToStep = useCallback((newStep: ImportStep) => { setStep(newStep); }, []);

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setMappings([]);
    setValidation(null);
    setIssues([]);
    setPreviewData({ original: [], transformed: [] });
    setError(null);
    setProgress(INITIAL_PROGRESS);
    setLastSessionId(null);
  }, []);

  return {
    step, file, config, mappings, validation, issues, progress,
    previewData, isProcessing, error, lastSessionId,
    setTarget, uploadFile, setSelectedSheet, updateMapping, rerunAIMapping,
    runValidation, applyAutoFixAll, dismissIssue, updateConfig,
    startImport, cancelImport, goToStep, reset,
  };
}
