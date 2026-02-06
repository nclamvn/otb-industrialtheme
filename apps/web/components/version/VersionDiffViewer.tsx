'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, Plus, Minus, Equal, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DiffRow {
  key: string;
  label: string;
  category?: string;
  oldValue: number | string;
  newValue: number | string;
  type: 'currency' | 'number' | 'percentage' | 'text';
}

interface VersionInfo {
  number: number;
  date: string;
  status?: 'draft' | 'final' | 'archived';
}

interface VersionDiffViewerProps {
  title: string;
  oldVersion: VersionInfo;
  newVersion: VersionInfo;
  rows: DiffRow[];
  className?: string;
  compact?: boolean;
}

export function VersionDiffViewer({
  title,
  oldVersion,
  newVersion,
  rows,
  className,
  compact = false,
}: VersionDiffViewerProps) {
  const stats = useMemo(() => {
    let added = 0, modified = 0, removed = 0, unchanged = 0;

    rows.forEach((row) => {
      if (row.oldValue === 0 && row.newValue !== 0) added++;
      else if (row.oldValue !== 0 && row.newValue === 0) removed++;
      else if (row.oldValue !== row.newValue) modified++;
      else unchanged++;
    });

    return { added, modified, removed, unchanged };
  }, [rows]);

  const formatValue = (value: number | string, type: string) => {
    if (typeof value === 'string') return value;
    switch (type) {
      case 'currency': return `$${value.toLocaleString()}`;
      case 'percentage': return `${value.toFixed(1)}%`;
      case 'number': return value.toLocaleString();
      default: return String(value);
    }
  };

  const getDiffInfo = (row: DiffRow) => {
    if (typeof row.oldValue === 'string' || typeof row.newValue === 'string') {
      return {
        status: row.oldValue === row.newValue ? 'same' : 'changed',
        diff: row.oldValue === row.newValue ? '—' : 'Changed',
        pctChange: '—'
      };
    }

    const oldVal = row.oldValue as number;
    const newVal = row.newValue as number;
    const diff = newVal - oldVal;
    const pctChange = oldVal !== 0
      ? ((diff / oldVal) * 100).toFixed(1)
      : newVal !== 0 ? '∞' : '0';

    if (diff === 0) return { status: 'same', diff: '—', pctChange: '0%' };
    if (diff > 0) return {
      status: 'increased',
      diff: `+${row.type === 'currency' ? '$' : ''}${Math.abs(diff).toLocaleString()}`,
      pctChange: `+${pctChange}%`
    };
    return {
      status: 'decreased',
      diff: `-${row.type === 'currency' ? '$' : ''}${Math.abs(diff).toLocaleString()}`,
      pctChange: `${pctChange}%`
    };
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-muted/50 p-4 border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="gap-1">
              <Plus className="w-3 h-3 text-green-500" />
              {stats.added} added
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ArrowRight className="w-3 h-3 text-blue-500" />
              {stats.modified} changed
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Minus className="w-3 h-3 text-red-500" />
              {stats.removed} removed
            </Badge>
          </div>
        </div>

        {/* Version Labels */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">
              v{oldVersion.number} ({oldVersion.date})
              {oldVersion.status && (
                <Badge variant="secondary" className="ml-1 text-[9px] h-4">
                  {oldVersion.status}
                </Badge>
              )}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#127749]" />
            <span className="text-xs font-medium">
              v{newVersion.number} ({newVersion.date})
              {newVersion.status && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 text-[9px] h-4",
                    newVersion.status === 'final' && 'bg-green-100 text-green-700'
                  )}
                >
                  {newVersion.status}
                </Badge>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Diff Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[200px]">Item</TableHead>
              <TableHead className="text-right w-[120px]">v{oldVersion.number}</TableHead>
              <TableHead className="text-right w-[120px]">v{newVersion.number}</TableHead>
              <TableHead className="text-right w-[100px]">Change</TableHead>
              {!compact && <TableHead className="text-right w-[80px]">%</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const { status, diff, pctChange } = getDiffInfo(row);

              return (
                <TableRow
                  key={row.key}
                  className={cn(
                    'transition-colors',
                    status === 'increased' && 'bg-green-50/50 dark:bg-green-950/10',
                    status === 'decreased' && 'bg-red-50/50 dark:bg-red-950/10',
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {status === 'increased' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {status === 'decreased' && <TrendingDown className="w-3 h-3 text-red-500" />}
                      {status === 'same' && <Equal className="w-3 h-3 text-muted-foreground" />}
                      <div>
                        <span className="font-medium text-sm">{row.label}</span>
                        {row.category && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {row.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatValue(row.oldValue, row.type)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {formatValue(row.newValue, row.type)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      'font-mono text-xs',
                      status === 'increased' && 'text-green-600',
                      status === 'decreased' && 'text-red-600',
                      status === 'same' && 'text-muted-foreground'
                    )}>
                      {diff}
                    </span>
                  </TableCell>
                  {!compact && (
                    <TableCell className="text-right">
                      <span className={cn(
                        'text-[10px] font-mono',
                        status === 'increased' && 'text-green-600',
                        status === 'decreased' && 'text-red-600',
                        status === 'same' && 'text-muted-foreground'
                      )}>
                        {pctChange}
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      <div className="bg-muted/30 px-4 py-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>{rows.length} items compared</span>
        <span>
          {stats.unchanged} unchanged • {stats.added + stats.modified + stats.removed} differences
        </span>
      </div>
    </div>
  );
}

// Demo data generator
export function generateMockDiffRows(): DiffRow[] {
  return [
    { key: '1', label: 'Bags', category: 'Women', oldValue: 1200000, newValue: 1350000, type: 'currency' },
    { key: '2', label: 'Shoes', category: 'Women', oldValue: 890000, newValue: 890000, type: 'currency' },
    { key: '3', label: 'Accessories', category: 'Women', oldValue: 450000, newValue: 380000, type: 'currency' },
    { key: '4', label: 'Ready-to-Wear', category: 'Women', oldValue: 680000, newValue: 750000, type: 'currency' },
    { key: '5', label: 'Bags', category: 'Men', oldValue: 520000, newValue: 620000, type: 'currency' },
    { key: '6', label: 'Shoes', category: 'Men', oldValue: 340000, newValue: 340000, type: 'currency' },
    { key: '7', label: 'Accessories', category: 'Men', oldValue: 180000, newValue: 0, type: 'currency' },
    { key: '8', label: 'Small Leather Goods', category: 'Unisex', oldValue: 0, newValue: 250000, type: 'currency' },
    { key: '9', label: 'Total SKUs', oldValue: 156, newValue: 178, type: 'number' },
    { key: '10', label: 'Avg. Margin', oldValue: 58.5, newValue: 61.2, type: 'percentage' },
  ];
}
