'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  SizingVersion,
  SizingVersionStatus,
  SIZING_VERSION_STATUS_CONFIG,
  ChoiceAllocationData,
} from './types';
import { useSizingVersion } from './hooks/useSizingVersion';
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
  Check,
  Clock,
  User,
  Tag,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SizingVersionPanelProps {
  skuProposalId?: string;
  currentData?: ChoiceAllocationData[];
  isOpen: boolean;
  onClose: () => void;
  onRollback?: (version: SizingVersion) => void;
  onSelectFinal?: (version: SizingVersion) => void;
}

function VersionStatusBadge({ status }: { status: SizingVersionStatus }) {
  const config = SIZING_VERSION_STATUS_CONFIG[status];
  return (
    <Badge className={cn('text-xs', config.bgColor, config.color)}>
      {config.label}
    </Badge>
  );
}

function VersionTimelineItem({
  version,
  isSelected,
  onSelect,
  onCompare,
  onRollback,
  onSetFinal,
}: {
  version: SizingVersion;
  isSelected: boolean;
  onSelect: () => void;
  onCompare: () => void;
  onRollback: () => void;
  onSetFinal: () => void;
}) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className={cn(
        'relative pl-8 pb-6 cursor-pointer group',
        'before:absolute before:left-[11px] before:top-8 before:w-[2px] before:h-[calc(100%-32px)] before:bg-slate-200 dark:before:bg-slate-700',
        'last:before:hidden'
      )}
      onClick={onSelect}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          isSelected
            ? 'bg-blue-500 border-blue-500 text-white'
            : version.status === 'CURRENT' || version.status === 'FINAL'
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'bg-card border-slate-300 dark:border-slate-600'
        )}
      >
        {version.status === 'FINAL' ? (
          <Star className="w-3 h-3" />
        ) : version.status === 'CURRENT' ? (
          <Check className="w-3 h-3" />
        ) : (
          <span className="text-[10px] font-bold">{version.versionNumber}</span>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'rounded-xl border p-4 transition-all',
          isSelected
            ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-700'
            : 'border-border hover:border-slate-300 dark:hover:border-slate-600 bg-card/50'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">
                {version.name}
              </h4>
              <VersionStatusBadge status={version.status} />
            </div>
            {version.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {version.description}
              </p>
            )}
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            v{version.versionNumber}.0
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div>
            <span className="text-slate-500">Units:</span>{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {version.totalUnits.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Value:</span>{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {formatCurrency(version.totalValue)}
            </span>
          </div>
          {version.changes.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {version.changes.length} changes
            </Badge>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {version.createdBy.name}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(version.createdAt)}
          </div>
        </div>

        {/* Tags */}
        {version.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {version.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onCompare();
            }}
          >
            <GitCompare className="w-3 h-3 mr-1" />
            Compare
          </Button>
          {version.status !== 'CURRENT' && version.status !== 'FINAL' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onRollback();
              }}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Rollback
            </Button>
          )}
          {version.status === 'CURRENT' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                onSetFinal();
              }}
            >
              <Star className="w-3 h-3 mr-1" />
              Set as Final
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SizingVersionPanel({
  skuProposalId,
  currentData,
  isOpen,
  onClose,
  onRollback,
  onSelectFinal,
}: SizingVersionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('timeline');
  const [rollbackVersion, setRollbackVersion] = useState<SizingVersion | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [finalVersion, setFinalVersion] = useState<SizingVersion | null>(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [compareWithId, setCompareWithId] = useState<string | null>(null);

  const {
    versions,
    selectedVersion,
    currentVersion,
    isLoading,
    error,
    loadVersions,
    selectVersion,
    createVersion,
    isCreating,
    comparison,
    isComparing,
    compareVersions,
    rollback,
    isRollingBack,
    setAsFinal,
  } = useSizingVersion({
    skuProposalId,
    initialData: currentData,
    autoLoad: isOpen,
  });

  const handleCompare = useCallback((versionId: string) => {
    if (currentVersion && versionId !== currentVersion.id) {
      setCompareWithId(versionId);
      compareVersions(currentVersion.id, versionId);
      setActiveTab('compare');
    }
  }, [currentVersion, compareVersions]);

  const handleRollback = (version: SizingVersion) => {
    setRollbackVersion(version);
  };

  const confirmRollback = useCallback(async () => {
    if (!rollbackVersion) return;

    const success = await rollback(rollbackVersion.id, true, 'User initiated rollback');
    if (success) {
      toast.success(`Rolled back to v${rollbackVersion.versionNumber}.0`);
      if (onRollback) {
        onRollback(rollbackVersion);
      }
    } else {
      toast.error('Failed to rollback');
    }
    setRollbackVersion(null);
  }, [rollbackVersion, rollback, onRollback]);

  const handleSetFinal = (version: SizingVersion) => {
    setFinalVersion(version);
    setShowFinalDialog(true);
  };

  const confirmSetFinal = useCallback(async () => {
    if (!finalVersion) return;

    const success = await setAsFinal(finalVersion.id);
    if (success) {
      toast.success(`Version v${finalVersion.versionNumber}.0 set as final`);
      if (onSelectFinal) {
        onSelectFinal(finalVersion);
      }
    } else {
      toast.error('Failed to set as final');
    }
    setFinalVersion(null);
    setShowFinalDialog(false);
  }, [finalVersion, setAsFinal, onSelectFinal]);

  const handleCreateVersion = useCallback(async () => {
    if (!newVersionName.trim()) {
      toast.error('Please enter a version name');
      return;
    }

    const version = await createVersion(newVersionName, newVersionDescription, currentData);
    if (version) {
      toast.success(`Created version: ${version.name}`);
      setShowCreateDialog(false);
      setNewVersionName('');
      setNewVersionDescription('');
    } else {
      toast.error('Failed to create version');
    }
  }, [newVersionName, newVersionDescription, createVersion, currentData]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-card border-l dark:border-neutral-800 shadow-2xl z-50 flex flex-col transition-all duration-300',
          isExpanded ? 'w-[800px]' : 'w-[480px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-800 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 border-2 border-border">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-neutral-100">Sizing Versions</h3>
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
              disabled={isCreating}
              className="mr-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Save Draft
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

        {/* Current Version Banner */}
        {currentVersion && (
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Current: {currentVersion.name}
                </span>
                <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600">
                  v{currentVersion.versionNumber}.0
                </Badge>
              </div>
              {currentVersion.status !== 'FINAL' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                  onClick={() => handleSetFinal(currentVersion)}
                >
                  <Star className="w-3 h-3 mr-1" />
                  Select as Final
                </Button>
              )}
            </div>
          </div>
        )}

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
              <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-neutral-400">Loading sizing versions...</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 p-1 m-4 mb-0 bg-muted dark:bg-neutral-800 rounded-lg">
              <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-neutral-900">
                <History className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="flex items-center gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-neutral-900"
                disabled={!comparison}
              >
                <GitCompare className="h-4 w-4" />
                Compare
                {isComparing && <Loader2 className="h-3 w-3 animate-spin" />}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="timeline" className="mt-0 h-full">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {versions.map((version) => (
                      <VersionTimelineItem
                        key={version.id}
                        version={version}
                        isSelected={selectedVersion?.id === version.id}
                        onSelect={() => selectVersion(version.id)}
                        onCompare={() => handleCompare(version.id)}
                        onRollback={() => handleRollback(version)}
                        onSetFinal={() => handleSetFinal(version)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="compare" className="mt-0 h-full">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {isComparing ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
                        <span className="text-slate-500">Comparing versions...</span>
                      </div>
                    ) : comparison ? (
                      <div className="space-y-4">
                        {/* Comparison Header */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                          <div className="text-center flex-1">
                            <p className="text-xs text-slate-500 mb-1">From</p>
                            <p className="font-medium">{comparison.leftVersion.name}</p>
                            <p className="text-xs text-slate-400">v{comparison.leftVersion.versionNumber}.0</p>
                          </div>
                          <GitCompare className="h-5 w-5 text-slate-400 mx-4" />
                          <div className="text-center flex-1">
                            <p className="text-xs text-slate-500 mb-1">To</p>
                            <p className="font-medium">{comparison.rightVersion.name}</p>
                            <p className="text-xs text-slate-400">v{comparison.rightVersion.versionNumber}.0</p>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                            <p className="text-2xl font-bold text-blue-600">{comparison.summary.totalChanges}</p>
                            <p className="text-xs text-blue-600/70">Total Changes</p>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
                            <p className="text-2xl font-bold text-emerald-600">
                              {comparison.summary.unitsDiff > 0 ? '+' : ''}{comparison.summary.unitsDiff.toLocaleString()}
                            </p>
                            <p className="text-xs text-emerald-600/70">Units Diff</p>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-center">
                            <p className="text-2xl font-bold text-amber-600">
                              {comparison.summary.valueDiff > 0 ? '+' : ''}{(comparison.summary.valueDiff / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-amber-600/70">Value Diff</p>
                          </div>
                        </div>

                        {/* Changes List */}
                        {comparison.changes.modified.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Modified</h4>
                            <div className="space-y-2">
                              {comparison.changes.modified.map((change) => (
                                <div key={change.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">
                                      {change.skuCode && <code className="text-xs mr-2">{change.skuCode}</code>}
                                      {change.sizeName} - {change.field}
                                    </span>
                                    <span className="text-sm">
                                      <span className="text-red-500 line-through mr-2">{change.oldValue}</span>
                                      <span className="text-green-600">{change.newValue}</span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        Select a version to compare with the current version
                      </div>
                    )}
                  </div>
                </ScrollArea>
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
              This will restore sizing data to "{rollbackVersion?.name}". Current changes will be saved as a draft version.
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

      {/* Set Final Confirmation */}
      <AlertDialog open={showFinalDialog} onOpenChange={setShowFinalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Final Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark v{finalVersion?.versionNumber}.0 "{finalVersion?.name}" as the final sizing version. This version will be used for the ticket submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSetFinal}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Star className="w-4 h-4 mr-2" />
              Set as Final
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Sizing Draft</DialogTitle>
            <DialogDescription>
              Save the current sizing allocation as a new draft version for future reference or rollback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                placeholder="e.g., Adjusted for Store A"
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
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SizingVersionPanel;
