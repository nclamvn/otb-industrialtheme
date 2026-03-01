import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { planningService } from '../services';

/**
 * Hook for managing budget allocation save operations.
 * Provides handleSave (update existing) and handleSaveAsNew (copy + update).
 */
export function useBudgetAllocateSave({
  selectedVersionId,
  selectedBudgetId,
  allocationValues,
  seasonTotalValues,
  brandTotalValues,
  allocationComments,
  sessionRecovery,
  t,
}) {
  const [saving, setSaving] = useState(false);

  // Build allocations payload from current state
  const buildAllocations = useCallback(() => {
    return {
      allocations: allocationValues,
      seasonTotals: seasonTotalValues,
      brandTotals: brandTotalValues,
      comments: allocationComments,
    };
  }, [allocationValues, seasonTotalValues, brandTotalValues, allocationComments]);

  // Save (PUT update existing version)
  const handleSave = useCallback(async () => {
    if (!selectedVersionId) {
      toast.error(t?.('planning.selectVersion') || 'Select a version first');
      return;
    }
    setSaving(true);
    try {
      const payload = buildAllocations();
      await planningService.update(selectedVersionId, payload);
      sessionRecovery?.clearDraft?.();
      toast.success(t?.('planning.savedSuccessfully') || 'Saved successfully');
    } catch (err) {
      console.error('Failed to save allocation:', err);
      toast.error(t?.('planning.saveFailed') || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [selectedVersionId, buildAllocations, sessionRecovery, t]);

  // Save as new version (POST copy + PUT update)
  const handleSaveAsNew = useCallback(async () => {
    if (!selectedVersionId) {
      toast.error(t?.('planning.selectVersion') || 'Select a version first');
      return null;
    }
    setSaving(true);
    try {
      // Copy the current version
      const newVersion = await planningService.copy(selectedVersionId);
      const newId = newVersion?.id || newVersion;

      // Update the new version with current allocations
      const payload = buildAllocations();
      await planningService.update(newId, payload);

      sessionRecovery?.clearDraft?.();
      toast.success(t?.('planning.versionCopied') || 'Version copied and saved');

      return newId;
    } catch (err) {
      console.error('Failed to save as new version:', err);
      toast.error(t?.('planning.saveFailed') || 'Failed to save');
      return null;
    } finally {
      setSaving(false);
    }
  }, [selectedVersionId, buildAllocations, sessionRecovery, t]);

  return {
    saving,
    handleSave,
    handleSaveAsNew,
    buildAllocations,
  };
}

export default useBudgetAllocateSave;
