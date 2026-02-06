'use client';

import { useState, useCallback, useRef, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-2: useBatchEdit Hook — Batch Edit State Management
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

export interface BatchField {
  field: string;
  label: string;
  type: 'text' | 'number' | 'percent' | 'currency' | 'select' | 'date';
  options?: { value: string; label: string }[];
  validation?: (value: unknown) => string | null;
}

export interface BatchEditChange {
  field: string;
  value: unknown;
  previousValues: Map<string, unknown>;
}

export interface BatchEditHistoryEntry {
  id: string;
  timestamp: Date;
  changes: BatchEditChange[];
  affectedRows: string[];
  status: 'applied' | 'undone' | 'pending';
}

export interface BatchEditState {
  selectedRowIds: Set<string>;
  pendingChanges: Map<string, unknown>;
  isApplying: boolean;
  progress: { current: number; total: number } | null;
  errors: Map<string, string>;
  history: BatchEditHistoryEntry[];
  historyIndex: number;
}

interface UseBatchEditOptions<T extends Record<string, unknown>> {
  data: T[];
  idField: keyof T;
  editableFields: BatchField[];
  onApply?: (rowIds: string[], changes: Record<string, unknown>) => Promise<void>;
  maxBatchSize?: number;
  enableOptimisticUpdate?: boolean;
}

export function useBatchEdit<T extends Record<string, unknown>>({
  data,
  idField,
  editableFields,
  onApply,
  maxBatchSize = 500,
}: UseBatchEditOptions<T>) {
  const [state, setState] = useState<BatchEditState>({
    selectedRowIds: new Set(),
    pendingChanges: new Map(),
    isApplying: false,
    progress: null,
    errors: new Map(),
    history: [],
    historyIndex: -1,
  });

  const abortRef = useRef<AbortController | null>(null);

  // ─── Selection ─────────────────────────────────────────────────────────────
  const selectRow = useCallback((id: string) => {
    setState((prev) => {
      const next = new Set(prev.selectedRowIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, selectedRowIds: next };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState((prev) => {
      const allIds = data.map((row) => String(row[idField]));
      const allSelected = allIds.every((id) => prev.selectedRowIds.has(id));
      return {
        ...prev,
        selectedRowIds: allSelected ? new Set() : new Set(allIds),
      };
    });
  }, [data, idField]);

  const selectRange = useCallback(
    (startId: string, endId: string) => {
      const ids = data.map((row) => String(row[idField]));
      const startIdx = ids.indexOf(startId);
      const endIdx = ids.indexOf(endId);
      if (startIdx === -1 || endIdx === -1) return;
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      const rangeIds = ids.slice(from, to + 1);
      setState((prev) => {
        const next = new Set(prev.selectedRowIds);
        rangeIds.forEach((id) => next.add(id));
        return { ...prev, selectedRowIds: next };
      });
    },
    [data, idField]
  );

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedRowIds: new Set() }));
  }, []);

  // ─── Pending Changes ──────────────────────────────────────────────────────
  const setPendingChange = useCallback((field: string, value: unknown) => {
    setState((prev) => {
      const next = new Map(prev.pendingChanges);
      if (value === undefined || value === null || value === '') {
        next.delete(field);
      } else {
        next.set(field, value);
      }
      // Validate
      const errors = new Map(prev.errors);
      const fieldDef = editableFields.find((f) => f.field === field);
      if (fieldDef?.validation) {
        const error = fieldDef.validation(value);
        if (error) errors.set(field, error);
        else errors.delete(field);
      }
      return { ...prev, pendingChanges: next, errors };
    });
  }, [editableFields]);

  const clearPendingChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingChanges: new Map(),
      errors: new Map(),
    }));
  }, []);

  // ─── Preview ──────────────────────────────────────────────────────────────
  const preview = useMemo(() => {
    if (state.selectedRowIds.size === 0 || state.pendingChanges.size === 0)
      return [];

    return data
      .filter((row) => state.selectedRowIds.has(String(row[idField])))
      .map((row) => {
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        state.pendingChanges.forEach((value, field) => {
          if (row[field] !== value) {
            changes[field] = { from: row[field], to: value };
          }
        });
        return {
          id: String(row[idField]),
          row,
          changes,
          hasChanges: Object.keys(changes).length > 0,
        };
      })
      .filter((item) => item.hasChanges);
  }, [data, idField, state.selectedRowIds, state.pendingChanges]);

  // ─── Apply Changes ────────────────────────────────────────────────────────
  const applyChanges = useCallback(async () => {
    if (state.selectedRowIds.size === 0 || state.pendingChanges.size === 0)
      return;
    if (state.selectedRowIds.size > maxBatchSize) {
      setState((prev) => ({
        ...prev,
        errors: new Map([
          ['_batch', `Tối đa ${maxBatchSize} dòng mỗi lần chỉnh sửa`],
        ]),
      }));
      return;
    }
    if (state.errors.size > 0) return;

    abortRef.current = new AbortController();
    const rowIds = Array.from(state.selectedRowIds);
    const changes = Object.fromEntries(state.pendingChanges);

    // Build history entry with previous values
    const previousValues = new Map<string, unknown>();
    const affectedRows = data.filter((row) =>
      state.selectedRowIds.has(String(row[idField]))
    );
    affectedRows.forEach((row) => {
      state.pendingChanges.forEach((_, field) => {
        previousValues.set(`${String(row[idField])}:${field}`, row[field]);
      });
    });

    const historyEntry: BatchEditHistoryEntry = {
      id: `batch-${Date.now()}`,
      timestamp: new Date(),
      changes: Array.from(state.pendingChanges.entries()).map(
        ([field, value]) => ({ field, value, previousValues })
      ),
      affectedRows: rowIds,
      status: 'pending',
    };

    setState((prev) => ({
      ...prev,
      isApplying: true,
      progress: { current: 0, total: rowIds.length },
    }));

    try {
      if (onApply) {
        await onApply(rowIds, changes);
      }

      historyEntry.status = 'applied';
      setState((prev) => ({
        ...prev,
        isApplying: false,
        progress: null,
        pendingChanges: new Map(),
        selectedRowIds: new Set(),
        history: [
          ...prev.history.slice(0, prev.historyIndex + 1),
          historyEntry,
        ],
        historyIndex: prev.historyIndex + 1,
      }));
    } catch (error) {
      historyEntry.status = 'undone';
      setState((prev) => ({
        ...prev,
        isApplying: false,
        progress: null,
        errors: new Map([
          [
            '_apply',
            error instanceof Error ? error.message : 'Lỗi áp dụng thay đổi',
          ],
        ]),
      }));
    }
  }, [state, data, idField, maxBatchSize, onApply]);

  // ─── Abort ────────────────────────────────────────────────────────────────
  const abortApply = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isApplying: false, progress: null }));
  }, []);

  // ─── Undo / Redo ──────────────────────────────────────────────────────────
  const canUndo = state.historyIndex >= 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    setState((prev) => {
      const entry = prev.history[prev.historyIndex];
      if (entry) entry.status = 'undone';
      return { ...prev, historyIndex: prev.historyIndex - 1 };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    setState((prev) => {
      const entry = prev.history[prev.historyIndex + 1];
      if (entry) entry.status = 'applied';
      return { ...prev, historyIndex: prev.historyIndex + 1 };
    });
  }, [canRedo]);

  // ─── Computed ─────────────────────────────────────────────────────────────
  const selectionSummary = useMemo(() => {
    const count = state.selectedRowIds.size;
    const total = data.length;
    return {
      count,
      total,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      isAllSelected: count === total && total > 0,
      isPartialSelected: count > 0 && count < total,
    };
  }, [state.selectedRowIds, data]);

  return {
    // State
    selectedRowIds: state.selectedRowIds,
    pendingChanges: state.pendingChanges,
    isApplying: state.isApplying,
    progress: state.progress,
    errors: state.errors,
    history: state.history,
    preview,
    selectionSummary,
    // Selection
    selectRow,
    selectAll,
    selectRange,
    clearSelection,
    // Changes
    setPendingChange,
    clearPendingChanges,
    // Apply
    applyChanges,
    abortApply,
    // History
    canUndo,
    canRedo,
    undo,
    redo,
  };
}
