'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  PlanningCSVRow,
  ExportOptions,
  DEFAULT_COLUMNS,
  COLUMN_HEADERS,
} from './utils/csv-generator';
import { ExportPreview } from './ExportPreview';
import { useCSVExport, ExportStatus } from './hooks/useCSVExport';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PlanningCSVRow[];
  title?: string;
  filenamePrefix?: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  data,
  title = 'Export Planning CSV',
  filenamePrefix = 'planning_export',
}: ExportDialogProps) {
  // Export options state
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateFormat, setDateFormat] = useState<ExportOptions['dateFormat']>('YYYY-MM-DD');
  const [delimiter, setDelimiter] = useState<ExportOptions['delimiter']>(',');
  const [selectedColumns, setSelectedColumns] = useState<Set<keyof PlanningCSVRow>>(
    new Set(DEFAULT_COLUMNS)
  );
  const [showPreview, setShowPreview] = useState(false);

  // Export hook
  const { status, progress, error, exportRawData, reset } = useCSVExport();

  // Filter data based on selected columns
  const previewData = useMemo(() => {
    return data.slice(0, 5);
  }, [data]);

  // Handle column toggle
  const toggleColumn = (column: keyof PlanningCSVRow) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(column)) {
      newSelected.delete(column);
    } else {
      newSelected.add(column);
    }
    setSelectedColumns(newSelected);
  };

  // Handle export
  const handleExport = async () => {
    const options: Partial<ExportOptions> = {
      includeHeaders,
      dateFormat,
      delimiter,
      columns: Array.from(selectedColumns) as (keyof PlanningCSVRow)[],
      filename: `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`,
    };

    await exportRawData(data, options);
  };

  // Handle close
  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Status icon
  const StatusIcon = () => {
    switch (status) {
      case 'preparing':
      case 'generating':
      case 'downloading':
        return <Loader2 className="w-5 h-5 animate-spin text-amber-500" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileSpreadsheet className="w-5 h-5 text-slate-500 dark:text-neutral-400" />;
    }
  };

  const statusText = () => {
    switch (status) {
      case 'preparing':
        return 'Preparing data...';
      case 'generating':
        return 'Generating CSV...';
      case 'downloading':
        return 'Starting download...';
      case 'complete':
        return 'Export complete!';
      case 'error':
        return error || 'Export failed';
      default:
        return `${data.length.toLocaleString()} rows ready to export`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-neutral-100">
            <Download className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Bar */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-neutral-800">
            <StatusIcon />
            <span className="text-sm text-slate-600 dark:text-neutral-300">
              {statusText()}
            </span>
            {status !== 'idle' && status !== 'complete' && status !== 'error' && (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-neutral-400">{progress}%</span>
              </div>
            )}
          </div>

          {/* Options - disabled during export */}
          <div className={cn('space-y-4', status !== 'idle' && 'opacity-50 pointer-events-none')}>
            {/* Date Format & Delimiter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-neutral-300">Date Format</Label>
                <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as ExportOptions['dateFormat'])}>
                  <SelectTrigger className="bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-neutral-300">Delimiter</Label>
                <Select value={delimiter} onValueChange={(v) => setDelimiter(v as ExportOptions['delimiter'])}>
                  <SelectTrigger className="bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Comma (,)</SelectItem>
                    <SelectItem value=";">Semicolon (;)</SelectItem>
                    <SelectItem value={'\t'}>Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Include Headers */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeHeaders"
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(checked === true)}
              />
              <Label htmlFor="includeHeaders" className="text-slate-700 dark:text-neutral-300">
                Include column headers
              </Label>
            </div>

            {/* Column Selection */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-neutral-300">Include Columns</Label>
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-800/50">
                {DEFAULT_COLUMNS.map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={`col-${column}`}
                      checked={selectedColumns.has(column)}
                      onCheckedChange={() => toggleColumn(column)}
                    />
                    <Label
                      htmlFor={`col-${column}`}
                      className="text-sm text-slate-600 dark:text-neutral-400"
                    >
                      {COLUMN_HEADERS[column]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-slate-600 dark:text-neutral-400"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <span className="text-xs text-slate-400 dark:text-neutral-500">
                First 5 rows
              </span>
            </div>

            {/* Preview */}
            {showPreview && (
              <ExportPreview
                data={previewData}
                columns={Array.from(selectedColumns) as (keyof PlanningCSVRow)[]}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="dark:border-neutral-700">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={status !== 'idle' || selectedColumns.size === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {status !== 'idle' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
