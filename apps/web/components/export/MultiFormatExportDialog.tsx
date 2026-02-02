'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  FileSpreadsheet,
  FileText,
  FileDown,
  Download,
  CheckCircle,
  Loader2,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

export type ExportFormat = 'xlsx' | 'pdf' | 'csv';

export interface MultiExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  includeComments: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sections?: string[];
}

interface MultiFormatExportDialogProps {
  title?: string;
  description?: string;
  entityType: 'budget' | 'otb' | 'sku' | 'report';
  entityId?: string;
  entityName?: string;
  availableSections?: { id: string; label: string }[];
  onExport?: (options: MultiExportOptions) => Promise<string>;
  trigger?: React.ReactNode;
}

const formatConfig: Record<ExportFormat, { icon: React.ComponentType<{ className?: string }>; label: string; description: string }> = {
  xlsx: {
    icon: FileSpreadsheet,
    label: 'Excel (.xlsx)',
    description: 'Best for data analysis and editing',
  },
  pdf: {
    icon: FileText,
    label: 'PDF Document',
    description: 'Best for sharing and printing',
  },
  csv: {
    icon: FileDown,
    label: 'CSV File',
    description: 'Best for importing to other systems',
  },
};

export function MultiFormatExportDialog({
  title = 'Export Data',
  description = 'Choose your export format and options',
  entityType,
  entityId,
  entityName,
  availableSections = [],
  onExport,
  trigger,
}: MultiFormatExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MultiExportOptions>({
    format: 'xlsx',
    includeCharts: true,
    includeComments: false,
  });
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(availableSections.map((s) => s.id))
  );
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormatChange = (newFormat: ExportFormat) => {
    setOptions((prev) => ({ ...prev, format: newFormat }));
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleExport = useCallback(async () => {
    setExportState('exporting');
    setProgress(0);
    setError(null);

    const exportOptions: MultiExportOptions = {
      ...options,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      sections: Array.from(selectedSections),
    };

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 300);

      if (onExport) {
        const url = await onExport(exportOptions);
        setDownloadUrl(url);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setDownloadUrl(`/api/exports/${entityType}/${entityId || 'demo'}.${options.format}`);
      }

      clearInterval(progressInterval);
      setProgress(100);
      setExportState('complete');
    } catch (err) {
      setExportState('error');
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [options, dateRange, selectedSections, entityType, entityId, onExport]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setExportState('idle');
      setProgress(0);
      setDownloadUrl(null);
      setError(null);
    }, 300);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#127749]" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {entityName && <span className="font-medium">{entityName}</span>}
            {entityName && ' — '}
            {description}
          </DialogDescription>
        </DialogHeader>

        {exportState === 'idle' && (
          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Format</Label>
              <RadioGroup
                value={options.format}
                onValueChange={(v) => handleFormatChange(v as ExportFormat)}
                className="grid grid-cols-3 gap-3"
              >
                {Object.entries(formatConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = options.format === key;

                  return (
                    <Label
                      key={key}
                      htmlFor={`format-${key}`}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-[#127749] bg-[#127749]/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <RadioGroupItem value={key} id={`format-${key}`} className="sr-only" />
                      <Icon className={cn('w-6 h-6', isSelected ? 'text-[#127749]' : 'text-muted-foreground')} />
                      <span className="text-xs font-medium text-center">{config.label}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                {formatConfig[options.format].description}
              </p>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Options
              </Label>

              {options.format !== 'csv' && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Include Charts</p>
                      <p className="text-xs text-muted-foreground">Add visual charts to export</p>
                    </div>
                  </div>
                  <Switch
                    checked={options.includeCharts}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, includeCharts: checked }))
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Include Comments</p>
                    <p className="text-xs text-muted-foreground">Add notes and comments</p>
                  </div>
                </div>
                <Switch
                  checked={options.includeComments}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, includeComments: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date Range</p>
                    <p className="text-xs text-muted-foreground">Filter data by date</p>
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      {dateRange.from
                        ? dateRange.to
                          ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                          : format(dateRange.from, 'MMM d')
                        : 'All dates'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarPicker
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {availableSections.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Include Sections</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSections.map((section) => {
                    const isSelected = selectedSections.has(section.id);
                    return (
                      <Badge
                        key={section.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected && 'bg-[#127749] hover:bg-[#0d5a36]'
                        )}
                        onClick={() => toggleSection(section.id)}
                      >
                        {section.label}
                        {isSelected && <CheckCircle className="w-3 h-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {exportState === 'exporting' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#127749] animate-spin" />
              <div className="text-center">
                <p className="font-medium">Generating Export...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we prepare your {formatConfig[options.format].label}
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {exportState === 'complete' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Export Ready!</p>
                <p className="text-sm text-muted-foreground">
                  Your {formatConfig[options.format].label} is ready to download
                </p>
              </div>
            </div>
          </div>
        )}

        {exportState === 'error' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Export Failed</p>
                <p className="text-sm text-muted-foreground">{error || 'An error occurred'}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {exportState === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} className="bg-[#127749] hover:bg-[#0d5a36]">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </>
          )}
          {exportState === 'exporting' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {exportState === 'complete' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleDownload} className="bg-[#127749] hover:bg-[#0d5a36]">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </>
          )}
          {exportState === 'error' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setExportState('idle')} variant="default">
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
