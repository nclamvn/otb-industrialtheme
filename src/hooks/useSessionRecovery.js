'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'otb_draft_';
const DEBOUNCE_MS = 2000;

export function useSessionRecovery(budgetId) {
  const [recovery, setRecovery] = useState({ hasDraft: false, draftInfo: null });
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef(null);

  const storageKey = budgetId ? `${STORAGE_PREFIX}${budgetId}` : null;

  useEffect(() => {
    if (!storageKey) { setRecovery({ hasDraft: false, draftInfo: null }); return; }
    setDismissed(false);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        const changeCount =
          Object.keys(data.allocationValues || {}).length +
          Object.keys(data.seasonTotalValues || {}).length +
          Object.keys(data.brandTotalValues || {}).length;
        if (changeCount > 0) {
          setRecovery({ hasDraft: true, draftInfo: { savedAt: data.savedAt, changeCount } });
        } else {
          setRecovery({ hasDraft: false, draftInfo: null });
        }
      }
    } catch { setRecovery({ hasDraft: false, draftInfo: null }); }
  }, [storageKey]);

  const saveDraft = useCallback((allocationValues, seasonTotalValues, brandTotalValues) => {
    if (!storageKey) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          allocationValues, seasonTotalValues, brandTotalValues,
          savedAt: new Date().toISOString(), budgetId,
        }));
      } catch { /* ignore */ }
    }, DEBOUNCE_MS);
  }, [storageKey, budgetId]);

  const recoverDraft = useCallback(() => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        localStorage.removeItem(storageKey);
        setRecovery({ hasDraft: false, draftInfo: null });
        setDismissed(true);
        return data;
      }
    } catch { /* ignore */ }
    return null;
  }, [storageKey]);

  const dismissDraft = useCallback(() => {
    if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } }
    setRecovery({ hasDraft: false, draftInfo: null });
    setDismissed(true);
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } }
    setRecovery({ hasDraft: false, draftInfo: null });
  }, [storageKey]);

  return {
    hasDraft: recovery.hasDraft && !dismissed,
    draftInfo: recovery.draftInfo,
    saveDraft, recoverDraft, dismissDraft, clearDraft,
  };
}

export default useSessionRecovery;
