'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from '../types';
import { VersionTimeline } from './VersionTimeline';
import { VersionComparison } from './VersionComparison';
import { BudgetVersion } from './types';
import { useVersionHistory } from '../hooks/useVersionHistory';
import {
  History,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  GitCompare,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface VersionHistoryPanelProps {
  budgetId?: string;
  data: BudgetNode;
  isOpen: boolean;
  onClose: () => void;
  onRollback?: (version: BudgetVersion) => void;
}

export function VersionHistoryPanel({
  budgetId,
  data,
  isOpen,
  onClose,
  onRollback,
}: VersionHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('timeline');
  const [compareVersionIds, setCompareVersionIds] = useState<{ left: string; right: string } | null>(null);
  const [rollbackVersion, setRollbackVersion] = useState<BudgetVersion | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');

  // Use the version history hook for API integration
  const {
    versions,
    isLoading,
    error,
    loadVersions,
    selectedVersion,
    selectVersion,
    createVersion,
    isCreating,
    comparison,
    isComparing,
    compareVersions,
    clearComparison,
    rollback,
    isRollingBack,
  } = useVersionHistory({
    budgetId: budgetId || '',
    budgetNode: data,
    autoLoad: isOpen,
  });

  const leftVersion = useMemo(
    () => compareVersionIds && versions.find((v) => v.id === compareVersionIds.left),
    [versions, compareVersionIds]
  );

  const rightVersion = useMemo(
    () => compareVersionIds && versions.find((v) => v.id === compareVersionIds.right),
    [versions, compareVersionIds]
  );

  const handleCompare = useCallback(async (leftId: string, rightId: string) => {
    setCompareVersionIds({ left: leftId, right: rightId });
    setActiveTab('compare');

    // Try to use API comparison if budgetId is available
    if (budgetId) {
      await compareVersions(leftId, rightId);
    }
  }, [budgetId, compareVersions]);

  const handleRollback = (version: BudgetVersion) => {
    setRollbackVersion(version);
  };

  const confirmRollback = useCallback(async () => {
    if (!rollbackVersion) return;

    // Try API rollback first if budgetId is provided
    if (budgetId) {
      const success = await rollback(rollbackVersion.id, true, 'User initiated rollback');
      if (success) {
        toast.success(`Rolled back to v${rollbackVersion.versionNumber}.0`);
        setRollbackVersion(null);
        return;
      }
    }

    // Fallback to local handler
    if (onRollback) {
      onRollback(rollbackVersion);
      toast.success(`Rolled back to v${rollbackVersion.versionNumber}.0`);
    }
    setRollbackVersion(null);
  }, [budgetId, rollbackVersion, rollback, onRollback]);

  const handleCreateVersion = useCallback(async () => {
    if (!newVersionName.trim()) {
      toast.error('Please enter a version name');
      return;
    }

    const version = await createVersion(newVersionName, newVersionDescription);
    if (version) {
      toast.success(`Created version: ${version.name}`);
      setShowCreateDialog(false);
      setNewVersionName('');
      setNewVersionDescription('');
    } else {
      toast.error('Failed to create version');
    }
  }, [newVersionName, newVersionDescription, createVersion]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-white dark:bg-neutral-950 border-l dark:border-neutral-800 shadow-2xl z-50 flex flex-col transition-all duration-300',
          isExpanded ? 'w-[800px]' : 'w-[480px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-neutral-100">Version History</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {isLoading ? 'Loading...' : `${versions.length} versions`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={isCreating || !budgetId}
              className="mr-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Snapshot
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button variant="ghost" size="sm" onClick={loadVersions} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-neutral-500 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-neutral-400">Loading version history...</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 p-1 m-4 mb-0 bg-slate-100 dark:bg-neutral-800 rounded-lg">
              <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900">
                <History className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900"
                disabled={!compareVersionIds}
              >
                <GitCompare className="h-4 w-4" />
                Compare
                {isComparing && <Loader2 className="h-3 w-3 animate-spin" />}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="timeline" className="mt-0 h-full">
                <VersionTimeline
                  versions={versions}
                  selectedVersionId={selectedVersion?.id}
                  onSelectVersion={(v) => selectVersion(v.id)}
                  onCompareVersions={handleCompare}
                  onRollback={handleRollback}
                />
              </TabsContent>

              <TabsContent value="compare" className="mt-0 h-full">
                {isComparing ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-neutral-500 mr-2" />
                    <span className="text-slate-500 dark:text-neutral-400">Comparing versions...</span>
                  </div>
                ) : leftVersion && rightVersion ? (
                  <VersionComparison
                    leftVersion={leftVersion}
                    rightVersion={rightVersion}
                    comparison={comparison || undefined}
                  />
                ) : (
                  <div className="text-center py-12 text-slate-500 dark:text-neutral-400">
                    Select two versions to compare
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>

      {/* Rollback Confirmation */}
      <AlertDialog open={!!rollbackVersion} onOpenChange={() => setRollbackVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback to v{rollbackVersion?.versionNumber}.0?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the budget to "{rollbackVersion?.name}". Current changes will be saved as a new version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRollingBack}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRollback}
              disabled={isRollingBack}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isRollingBack ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Version Snapshot</DialogTitle>
            <DialogDescription>
              Save the current budget state as a new version for future reference or rollback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                placeholder="e.g., Q1 Planning Draft"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version-description">Description (Optional)</Label>
              <Textarea
                id="version-description"
                placeholder="Describe the changes in this version..."
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={isCreating || !newVersionName.trim()}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VersionHistoryPanel;
