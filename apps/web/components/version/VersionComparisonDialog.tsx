'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GitCompare } from 'lucide-react';
import { VersionDiffViewer, generateMockDiffRows, DiffRow } from './VersionDiffViewer';
import { VersionSelector, generateMockVersions, Version } from './VersionSelector';

interface VersionComparisonDialogProps {
  entityType: 'budget' | 'otb' | 'sku';
  entityId?: string;
  entityName?: string;
  trigger?: React.ReactNode;
}

export function VersionComparisonDialog({
  entityType,
  entityId,
  entityName,
  trigger,
}: VersionComparisonDialogProps) {
  const [open, setOpen] = useState(false);
  const [versions] = useState<Version[]>(generateMockVersions());
  const [selectedLeft, setSelectedLeft] = useState<Version | null>(null);
  const [selectedRight, setSelectedRight] = useState<Version | null>(null);
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const handleCompare = () => {
    // In real implementation, fetch diff data from API
    // For now, use mock data
    setDiffRows(generateMockDiffRows());
    setShowDiff(true);
  };

  const handleReset = () => {
    setShowDiff(false);
    setSelectedLeft(null);
    setSelectedRight(null);
    setDiffRows([]);
  };

  const getTitle = () => {
    switch (entityType) {
      case 'budget': return 'Budget Version Comparison';
      case 'otb': return 'OTB Plan Version Comparison';
      case 'sku': return 'SKU Proposal Version Comparison';
      default: return 'Version Comparison';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) handleReset();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Versions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {entityName && <span className="font-medium">{entityName}</span>}
            {' '}— Select two versions to compare changes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Version Selector */}
          <VersionSelector
            versions={versions}
            selectedLeft={selectedLeft}
            selectedRight={selectedRight}
            onSelectLeft={setSelectedLeft}
            onSelectRight={setSelectedRight}
            onCompare={handleCompare}
          />

          {/* Diff Viewer */}
          {showDiff && selectedLeft && selectedRight && (
            <VersionDiffViewer
              title={`${entityName || getTitle()} Changes`}
              oldVersion={{
                number: selectedLeft.number,
                date: selectedLeft.date,
                status: selectedLeft.status,
              }}
              newVersion={{
                number: selectedRight.number,
                date: selectedRight.date,
                status: selectedRight.status,
              }}
              rows={diffRows}
            />
          )}

          {/* Empty State */}
          {!showDiff && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
              <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Select two versions above and click Compare</p>
              <p className="text-xs mt-1">to see detailed changes between versions</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {showDiff && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Compare Different Versions
            </Button>
            <Button className="bg-[#127749] hover:bg-[#0d5a36]">
              Export Diff Report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
