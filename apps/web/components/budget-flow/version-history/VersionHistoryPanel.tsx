'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from '../types';
import { VersionTimeline } from './VersionTimeline';
import { VersionComparison } from './VersionComparison';
import { BudgetVersion, generateDemoVersions } from './types';
import { History, X, Maximize2, Minimize2, RotateCcw, GitCompare } from 'lucide-react';
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

interface VersionHistoryPanelProps {
  data: BudgetNode;
  isOpen: boolean;
  onClose: () => void;
  onRollback?: (version: BudgetVersion) => void;
}

export function VersionHistoryPanel({
  data,
  isOpen,
  onClose,
  onRollback,
}: VersionHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('timeline');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareVersions, setCompareVersions] = useState<{ left: string; right: string } | null>(null);
  const [rollbackVersion, setRollbackVersion] = useState<BudgetVersion | null>(null);

  // Generate demo versions
  const versions = useMemo(() => generateDemoVersions(data), [data]);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId),
    [versions, selectedVersionId]
  );

  const leftVersion = useMemo(
    () => compareVersions && versions.find((v) => v.id === compareVersions.left),
    [versions, compareVersions]
  );

  const rightVersion = useMemo(
    () => compareVersions && versions.find((v) => v.id === compareVersions.right),
    [versions, compareVersions]
  );

  const handleCompare = (leftId: string, rightId: string) => {
    setCompareVersions({ left: leftId, right: rightId });
    setActiveTab('compare');
  };

  const handleRollback = (version: BudgetVersion) => {
    setRollbackVersion(version);
  };

  const confirmRollback = () => {
    if (rollbackVersion && onRollback) {
      onRollback(rollbackVersion);
      toast.success(`Rolled back to v${rollbackVersion.versionNumber}.0`);
    }
    setRollbackVersion(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-white border-l shadow-2xl z-50 flex flex-col transition-all duration-300',
          isExpanded ? 'w-[800px]' : 'w-[480px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Version History</h3>
              <p className="text-xs text-slate-500">{versions.length} versions</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 p-1 m-4 mb-0 bg-slate-100 rounded-lg">
            <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-white">
              <History className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="flex items-center gap-2 data-[state=active]:bg-white"
              disabled={!compareVersions}
            >
              <GitCompare className="h-4 w-4" />
              Compare
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="timeline" className="mt-0 h-full">
              <VersionTimeline
                versions={versions}
                selectedVersionId={selectedVersionId || undefined}
                onSelectVersion={(v) => setSelectedVersionId(v.id)}
                onCompareVersions={handleCompare}
                onRollback={handleRollback}
              />
            </TabsContent>

            <TabsContent value="compare" className="mt-0 h-full">
              {leftVersion && rightVersion ? (
                <VersionComparison leftVersion={leftVersion} rightVersion={rightVersion} />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Select two versions to compare
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRollback} className="bg-amber-500 hover:bg-amber-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default VersionHistoryPanel;
