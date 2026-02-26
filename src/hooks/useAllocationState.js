'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { planningService } from '../services';
import { invalidateCache } from '../services/api';

const MAX_UNDO_STACK = 50;
const DEBOUNCE_MS = 300;
const AUTO_SAVE_INTERVAL_MS = 30_000;

export const BRAND_BUDGET_CAP_PCT = 0.8;

const emptySnapshot = {
  allocationValues: {},
  seasonTotalValues: {},
  brandTotalValues: {},
  allocationComments: {},
};

const snapshotsEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function useAllocationState(t) {
  const [allocationValues, setAllocationValues] = useState({});
  const [seasonTotalValues, setSeasonTotalValues] = useState({});
  const [brandTotalValues, setBrandTotalValues] = useState({});
  const [allocationComments, setAllocationComments] = useState({});

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const debounceRef = useRef(null);

  const [cleanSnapshot, setCleanSnapshot] = useState(emptySnapshot);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const versionIdRef = useRef(null);

  const currentSnapshot = useMemo(
    () => ({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments }),
    [allocationValues, seasonTotalValues, brandTotalValues, allocationComments],
  );

  const isDirty = useMemo(
    () => !snapshotsEqual(currentSnapshot, cleanSnapshot),
    [currentSnapshot, cleanSnapshot],
  );

  const pushUndo = useCallback((prev) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setUndoStack((stack) => {
        const next = [...stack, prev];
        return next.length > MAX_UNDO_STACK ? next.slice(-MAX_UNDO_STACK) : next;
      });
      setRedoStack([]);
    }, DEBOUNCE_MS);
  }, []);

  const handleAllocationChange = useCallback(
    (brandId, seasonGroup, subSeason, field, value) => {
      const key = `${brandId}-${seasonGroup}-${subSeason}`;
      const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
      pushUndo({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
      setAllocationValues((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: numValue },
      }));
    },
    [allocationValues, seasonTotalValues, brandTotalValues, allocationComments, pushUndo],
  );

  const handleSeasonTotalChange = useCallback(
    (brandId, seasonGroup, field, value) => {
      const key = `${brandId}-${seasonGroup}`;
      const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
      pushUndo({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
      setSeasonTotalValues((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: numValue },
      }));
    },
    [allocationValues, seasonTotalValues, brandTotalValues, allocationComments, pushUndo],
  );

  const handleBrandTotalChange = useCallback(
    (brandId, field, value) => {
      const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
      pushUndo({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
      setBrandTotalValues((prev) => ({
        ...prev,
        [brandId]: { ...prev[brandId], [field]: numValue },
      }));
    },
    [allocationValues, seasonTotalValues, brandTotalValues, allocationComments, pushUndo],
  );

  const handleCommentChange = useCallback(
    (brandId, seasonGroup, subSeason, comment) => {
      const key = `${brandId}-${seasonGroup}-${subSeason}`;
      pushUndo({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
      setAllocationComments((prev) => ({ ...prev, [key]: comment }));
    },
    [allocationValues, seasonTotalValues, brandTotalValues, allocationComments, pushUndo],
  );

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, { allocationValues, seasonTotalValues, brandTotalValues, allocationComments }]);
    setUndoStack((s) => s.slice(0, -1));
    setAllocationValues(prev.allocationValues);
    setSeasonTotalValues(prev.seasonTotalValues);
    setBrandTotalValues(prev.brandTotalValues);
    setAllocationComments(prev.allocationComments);
  }, [canUndo, undoStack, allocationValues, seasonTotalValues, brandTotalValues, allocationComments]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, { allocationValues, seasonTotalValues, brandTotalValues, allocationComments }]);
    setRedoStack((r) => r.slice(0, -1));
    setAllocationValues(next.allocationValues);
    setSeasonTotalValues(next.seasonTotalValues);
    setBrandTotalValues(next.brandTotalValues);
    setAllocationComments(next.allocationComments);
  }, [canRedo, redoStack, allocationValues, seasonTotalValues, brandTotalValues, allocationComments]);

  // Keyboard shortcuts: Ctrl+Z, Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Auto-save every 30s when dirty
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (!isDirty || !versionIdRef.current) return;

    autoSaveTimerRef.current = setInterval(async () => {
      if (!versionIdRef.current || saving) return;
      setAutoSaving(true);
      try {
        await planningService.update(versionIdRef.current, {
          allocationValues, seasonTotalValues, brandTotalValues, allocationComments,
        });
        setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
        const now = new Date();
        setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch { /* silent */ }
      finally { setAutoSaving(false); }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [isDirty, saving, allocationValues, seasonTotalValues, brandTotalValues, allocationComments]);

  const setVersionId = useCallback((id) => { versionIdRef.current = id; }, []);

  // Beforeunload warning when dirty
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Validation
  const validate = useCallback(
    (totalBudget, totalAllocated, brandNames) => {
      const issues = [];

      if (totalBudget > 0 && totalAllocated > totalBudget) {
        issues.push({
          type: 'error', key: 'overBudget',
          message: 'planning.errorOverBudget',
          params: { amount: (totalAllocated - totalBudget).toLocaleString() },
        });
      }

      Object.entries(allocationValues).forEach(([key, storeValues]) => {
        if (storeValues && typeof storeValues === 'object') {
          Object.entries(storeValues).forEach(([field, val]) => {
            if (typeof val === 'number' && val < 0) {
              issues.push({
                type: 'error', key: `negative-${key}-${field}`,
                message: 'planning.errorNegativeValue',
                params: { field: `${key} / ${field}` },
              });
            }
          });
        }
      });

      if (totalBudget > 0) {
        const brandTotals = {};
        Object.entries(allocationValues).forEach(([key, storeValues]) => {
          const brandId = key.split('-')[0];
          if (!brandId) return;
          if (storeValues && typeof storeValues === 'object') {
            Object.values(storeValues).forEach((val) => {
              if (typeof val === 'number' && val > 0) {
                brandTotals[brandId] = (brandTotals[brandId] || 0) + val;
              }
            });
          }
        });

        const capPct = Math.round(BRAND_BUDGET_CAP_PCT * 100);
        Object.entries(brandTotals).forEach(([brandId, total]) => {
          const pct = Math.round((total / totalBudget) * 100);
          if (pct > capPct) {
            issues.push({
              type: 'warning', key: `brandCap-${brandId}`,
              message: 'planning.brandBudgetCapWarning',
              params: { brand: brandNames?.[brandId] || brandId, pct: String(pct), cap: String(capPct) },
            });
          }
        });
      }

      if (totalBudget > 0 && totalAllocated > 0) {
        const pct = Math.round((totalAllocated / totalBudget) * 100);
        if (pct < 80) {
          issues.push({
            type: 'warning', key: 'underAllocation',
            message: 'planning.warningUnderAllocation', params: { pct: String(pct) },
          });
        }
      }

      if (totalBudget > 0 && totalAllocated === 0 && Object.keys(allocationValues).length === 0) {
        issues.push({ type: 'warning', key: 'noAllocation', message: 'planning.warningNoAllocation' });
      }

      return issues;
    },
    [allocationValues],
  );

  // Save draft
  const saveDraft = useCallback(
    async (versionId) => {
      if (!versionId) return;
      setSaving(true);
      try {
        await planningService.update(versionId, {
          allocationValues, seasonTotalValues, brandTotalValues, allocationComments,
        });
        invalidateCache('/planning');
        setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
        const now = new Date();
        setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        toast.success(t('planning.draftSaved'));
      } catch (err) {
        console.error('Failed to save draft:', err);
        toast.error(t('planning.saveFailed'));
      } finally { setSaving(false); }
    },
    [allocationValues, seasonTotalValues, brandTotalValues, allocationComments, t],
  );

  // Submit for approval
  const submitForApproval = useCallback(
    async (versionId) => {
      if (!versionId) return;
      setSaving(true);
      try {
        await planningService.update(versionId, {
          allocationValues, seasonTotalValues, brandTotalValues, allocationComments,
        });
        await planningService.submit(versionId);
        invalidateCache('/planning');
        setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
        toast.success(t('planning.submittedForApproval'));
      } catch (err) {
        console.error('Failed to submit:', err);
        toast.error(t('planning.saveFailed'));
      } finally { setSaving(false); }
    },
    [allocationValues, seasonTotalValues, brandTotalValues, allocationComments, t],
  );

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        if (versionIdRef.current) saveDraft(versionIdRef.current);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveDraft]);

  // Discard changes
  const discardChanges = useCallback(() => {
    setAllocationValues(cleanSnapshot.allocationValues);
    setSeasonTotalValues(cleanSnapshot.seasonTotalValues);
    setBrandTotalValues(cleanSnapshot.brandTotalValues);
    setAllocationComments(cleanSnapshot.allocationComments);
    setUndoStack([]);
    setRedoStack([]);
  }, [cleanSnapshot]);

  const markClean = useCallback(() => {
    setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues, allocationComments });
  }, [allocationValues, seasonTotalValues, brandTotalValues, allocationComments]);

  return {
    allocationValues, setAllocationValues,
    seasonTotalValues, setSeasonTotalValues,
    brandTotalValues, setBrandTotalValues,
    allocationComments, setAllocationComments,
    handleAllocationChange, handleSeasonTotalChange, handleBrandTotalChange, handleCommentChange,
    canUndo, canRedo, undo, redo,
    isDirty, discardChanges, markClean, setCleanSnapshot,
    validate,
    saving, saveDraft, submitForApproval,
    autoSaving, lastSavedAt, setVersionId,
    pushUndo,
  };
}

export default useAllocationState;
