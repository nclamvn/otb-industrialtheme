'use client';

import { useState, useCallback } from 'react';
import {
  PlanningCSVRow,
  ExportOptions,
  DEFAULT_COLUMNS,
  generateCSV,
  generateFilename,
  downloadCSV,
  flattenBudgetToCSV,
  flattenSKUProposalToCSV,
  BudgetNode,
  SKUProposal,
} from '../utils/csv-generator';

export type ExportStatus = 'idle' | 'preparing' | 'generating' | 'downloading' | 'complete' | 'error';

export interface UseCSVExportReturn {
  status: ExportStatus;
  progress: number;
  error: string | null;
  exportBudgetData: (node: BudgetNode, options?: Partial<ExportOptions>) => Promise<void>;
  exportSKUData: (proposal: SKUProposal, options?: Partial<ExportOptions>) => Promise<void>;
  exportRawData: (rows: PlanningCSVRow[], options?: Partial<ExportOptions>) => Promise<void>;
  getPreviewRows: (rows: PlanningCSVRow[], count?: number) => PlanningCSVRow[];
  reset: () => void;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeHeaders: true,
  dateFormat: 'YYYY-MM-DD',
  delimiter: ',',
  columns: DEFAULT_COLUMNS,
};

export function useCSVExport(): UseCSVExportReturn {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  const exportRawData = useCallback(
    async (rows: PlanningCSVRow[], options?: Partial<ExportOptions>) => {
      try {
        setStatus('preparing');
        setProgress(10);
        setError(null);

        const mergedOptions: ExportOptions = { ...DEFAULT_OPTIONS, ...options };

        // Simulate preparation for large datasets
        await new Promise((resolve) => setTimeout(resolve, 100));
        setProgress(30);

        setStatus('generating');
        const csvContent = generateCSV(rows, mergedOptions);
        setProgress(70);

        // Generate filename
        const filename =
          mergedOptions.filename ||
          generateFilename('planning_export', mergedOptions.dateFormat);

        setStatus('downloading');
        setProgress(90);

        downloadCSV(csvContent, filename);

        setProgress(100);
        setStatus('complete');

        // Reset after a short delay
        setTimeout(() => {
          reset();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [reset]
  );

  const exportBudgetData = useCallback(
    async (node: BudgetNode, options?: Partial<ExportOptions>) => {
      try {
        setStatus('preparing');
        setProgress(10);
        setError(null);

        // Flatten budget hierarchy
        const rows = flattenBudgetToCSV(node);
        setProgress(40);

        if (rows.length === 0) {
          throw new Error('No data to export. Please ensure products with sizes are defined.');
        }

        // Use exportRawData for the rest
        const mergedOptions: ExportOptions = {
          ...DEFAULT_OPTIONS,
          ...options,
          filename: options?.filename || generateFilename('budget_planning', options?.dateFormat || 'YYYY-MM-DD'),
        };

        setStatus('generating');
        const csvContent = generateCSV(rows, mergedOptions);
        setProgress(70);

        setStatus('downloading');
        setProgress(90);

        downloadCSV(csvContent, mergedOptions.filename!);

        setProgress(100);
        setStatus('complete');

        setTimeout(() => {
          reset();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [reset]
  );

  const exportSKUData = useCallback(
    async (proposal: SKUProposal, options?: Partial<ExportOptions>) => {
      try {
        setStatus('preparing');
        setProgress(10);
        setError(null);

        // Flatten SKU proposal
        const rows = flattenSKUProposalToCSV(proposal);
        setProgress(40);

        if (rows.length === 0) {
          throw new Error('No data to export. Please ensure products with sizes are defined.');
        }

        const mergedOptions: ExportOptions = {
          ...DEFAULT_OPTIONS,
          ...options,
          filename: options?.filename || generateFilename('sku_proposal', options?.dateFormat || 'YYYY-MM-DD'),
        };

        setStatus('generating');
        const csvContent = generateCSV(rows, mergedOptions);
        setProgress(70);

        setStatus('downloading');
        setProgress(90);

        downloadCSV(csvContent, mergedOptions.filename!);

        setProgress(100);
        setStatus('complete');

        setTimeout(() => {
          reset();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        setStatus('error');
      }
    },
    [reset]
  );

  const getPreviewRows = useCallback(
    (rows: PlanningCSVRow[], count: number = 5): PlanningCSVRow[] => {
      return rows.slice(0, count);
    },
    []
  );

  return {
    status,
    progress,
    error,
    exportBudgetData,
    exportSKUData,
    exportRawData,
    getPreviewRows,
    reset,
  };
}

export default useCSVExport;
