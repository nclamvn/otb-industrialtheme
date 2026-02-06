'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-5: CategoryHeatmap — Performance Heatmap by Category
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';
import { CategoryPerformance } from '@/hooks/useAnalytics';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface CategoryHeatmapProps {
  data: {
    category: string;
    metrics: {
      label: string;
      value: number;
      max: number;
      inverted?: boolean;
    }[];
  }[];
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
  className?: string;
}

// ─── Category Heatmap Component ─────────────────────────────────────────────────
export function CategoryHeatmap({
  data,
  onCategorySelect,
  selectedCategory,
  className,
}: CategoryHeatmapProps) {
  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          Không có dữ liệu để hiển thị
        </CardContent>
      </Card>
    );
  }

  // Get all metric labels for header
  const metricLabels = data[0]?.metrics.map((m) => m.label) || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Hiệu suất theo danh mục</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-medium p-2 min-w-[120px]">Danh mục</th>
                {metricLabels.map((label) => (
                  <th key={label} className="text-center font-medium p-2 min-w-[80px]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.category}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50 transition-colors',
                    selectedCategory === row.category && 'bg-primary/5'
                  )}
                  onClick={() => onCategorySelect?.(row.category)}
                >
                  <td className="p-2 font-medium">{row.category}</td>
                  {row.metrics.map((metric) => (
                    <td key={metric.label} className="p-1">
                      <HeatmapCell metric={metric} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-4 text-xs text-muted-foreground">
          <span>Thấp</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-6 h-4 rounded"
                style={{ backgroundColor: getHeatmapColor(intensity) }}
              />
            ))}
          </div>
          <span>Cao</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Heatmap Cell Component ─────────────────────────────────────────────────────
interface HeatmapCellProps {
  metric: {
    label: string;
    value: number;
    max: number;
    inverted?: boolean;
  };
}

function HeatmapCell({ metric }: HeatmapCellProps) {
  const normalizedValue = metric.max > 0 ? metric.value / metric.max : 0;
  const intensity = metric.inverted ? 1 - normalizedValue : normalizedValue;
  const bgColor = getHeatmapColor(intensity);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="h-8 rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: bgColor,
              color: intensity > 0.5 ? 'white' : 'inherit',
            }}
          >
            {formatCellValue(metric.value, metric.label)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {metric.label}: {formatCellValue(metric.value, metric.label, true)}
          </p>
          {metric.inverted && (
            <p className="text-xs text-muted-foreground">Giá trị thấp hơn tốt hơn</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function getHeatmapColor(intensity: number): string {
  // Green color scale: from light to dark
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  if (clampedIntensity < 0.2) return 'hsl(120, 40%, 95%)';
  if (clampedIntensity < 0.4) return 'hsl(120, 50%, 80%)';
  if (clampedIntensity < 0.6) return 'hsl(120, 55%, 60%)';
  if (clampedIntensity < 0.8) return 'hsl(120, 60%, 45%)';
  return 'hsl(120, 65%, 35%)';
}

function formatCellValue(value: number, label: string, full = false): string {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('margin') || lowerLabel.includes('sell') || lowerLabel.includes('%')) {
    return `${value.toFixed(full ? 1 : 0)}%`;
  }

  if (lowerLabel.includes('revenue') || lowerLabel.includes('otb')) {
    if (full) {
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
      return value.toLocaleString('vi-VN');
    }
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
    return `${(value / 1e3).toFixed(0)}K`;
  }

  if (lowerLabel.includes('woc') || lowerLabel.includes('week')) {
    return value.toFixed(1);
  }

  if (value >= 1000) {
    return full ? value.toLocaleString('vi-VN') : `${(value / 1000).toFixed(1)}K`;
  }

  return value.toFixed(full ? 2 : 1);
}

// ─── Category Status Legend ─────────────────────────────────────────────────────
interface CategoryStatusLegendProps {
  className?: string;
}

export function CategoryStatusLegend({ className }: CategoryStatusLegendProps) {
  const statuses: { status: CategoryPerformance['status']; label: string; color: string }[] = [
    { status: 'excellent', label: 'Xuất sắc', color: 'bg-green-500' },
    { status: 'good', label: 'Tốt', color: 'bg-blue-500' },
    { status: 'warning', label: 'Cảnh báo', color: 'bg-amber-500' },
    { status: 'critical', label: 'Nghiêm trọng', color: 'bg-red-500' },
  ];

  return (
    <div className={cn('flex items-center gap-4 text-xs', className)}>
      {statuses.map(({ status, label, color }) => (
        <div key={status} className="flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default CategoryHeatmap;
