'use client';
import { useEffect, useCallback } from 'react';

export function useUnsavedChanges(isDirty) {
  const handleBeforeUnload = useCallback((e) => {
    if (!isDirty) return;
    e.preventDefault();
    e.returnValue = '';
  }, [isDirty]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);
}
