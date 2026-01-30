'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ExportDialog } from './ExportDialog';
import {
  PlanningCSVRow,
  flattenBudgetToCSV,
  flattenSKUProposalToCSV,
  BudgetNode,
  SKUProposal,
} from './utils/csv-generator';

interface PlanningCSVExportProps {
  // Either provide budget data or SKU data
  budgetData?: BudgetNode;
  skuData?: SKUProposal;
  // Or provide raw rows
  rawData?: PlanningCSVRow[];
  // UI customization
  buttonLabel?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  dialogTitle?: string;
  filenamePrefix?: string;
  className?: string;
  // Metadata
  seasonName?: string;
  collectionName?: string;
}

export function PlanningCSVExport({
  budgetData,
  skuData,
  rawData,
  buttonLabel = 'Export',
  buttonVariant = 'outline',
  buttonSize = 'default',
  dialogTitle = 'Export Planning CSV',
  filenamePrefix = 'planning_export',
  className,
  seasonName = 'SS26',
  collectionName = '',
}: PlanningCSVExportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Convert data to rows
  const exportData = useMemo((): PlanningCSVRow[] => {
    if (rawData) {
      return rawData;
    }

    if (budgetData) {
      return flattenBudgetToCSV(budgetData, seasonName);
    }

    if (skuData) {
      return flattenSKUProposalToCSV(skuData, collectionName);
    }

    return [];
  }, [rawData, budgetData, skuData, seasonName, collectionName]);

  const hasData = exportData.length > 0;

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setDialogOpen(true)}
        disabled={!hasData}
        className={className}
      >
        <Download className="w-4 h-4 mr-2" />
        {buttonLabel}
      </Button>

      <ExportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={exportData}
        title={dialogTitle}
        filenamePrefix={filenamePrefix}
      />
    </>
  );
}

export default PlanningCSVExport;
