'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-5: KPITrendChart — KPI Visualization with Sparklines
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';
import { KPIMetric } from '@/hooks/useAnalytics';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface KPITrendChartProps {
  kpis: KPIMetric[];
  selectedKPI?: string;
  onSelectKPI?: (id: string) => void;
  locale?: 'en' | 'vi';
  className?: string;
}

// ─── KPI Trend Chart Component ──────────────────────────────────────────────────
export function KPITrendChart({
  kpis,
  selectedKPI,
  onSelectKPI,
  locale = 'vi',
  className,
}: KPITrendChartProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.id}
          kpi={kpi}
          isSelected={selectedKPI === kpi.id}
          onSelect={() => onSelectKPI?.(kpi.id)}
          locale={locale}
        />
      ))}
    </div>
  );
}

// ─── KPI Card Component ─────────────────────────────────────────────────────────
interface KPICardProps {
  kpi: KPIMetric;
  isSelected: boolean;
  onSelect: () => void;
  locale: 'en' | 'vi';
}

function KPICard({ kpi, isSelected, onSelect, locale }: KPICardProps) {
  const formattedValue = formatKPIValue(kpi.value, kpi.format, locale);
  const formattedPrevious = formatKPIValue(kpi.previousValue, kpi.format, locale);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-md'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span>{locale === 'vi' ? kpi.labelVi : kpi.label}</span>
          {kpi.target && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Target className="w-4 h-4 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mục tiêu: {formatKPIValue(kpi.target, kpi.format, locale)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{formattedValue}</span>
          <TrendBadge trend={kpi.trend} changePercent={kpi.changePercent} />
        </div>

        {/* Previous Value */}
        <p className="text-xs text-muted-foreground mt-1">
          Kỳ trước: {formattedPrevious}
        </p>

        {/* Target Progress */}
        {kpi.target && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Tiến độ mục tiêu</span>
              <span className="font-medium">
                {Math.round((kpi.value / kpi.target) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  kpi.value >= kpi.target
                    ? 'bg-green-500'
                    : kpi.value >= kpi.target * 0.8
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Sparkline */}
        {kpi.sparkline && kpi.sparkline.length > 0 && (
          <div className="mt-3 h-10">
            <Sparkline data={kpi.sparkline} trend={kpi.trend} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Trend Badge Component ──────────────────────────────────────────────────────
interface TrendBadgeProps {
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
}

function TrendBadge({ trend, changePercent }: TrendBadgeProps) {
  const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
        trend === 'up' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        trend === 'down' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        trend === 'flat' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      )}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(changePercent).toFixed(1)}%
    </span>
  );
}

// ─── Sparkline Component ────────────────────────────────────────────────────────
interface SparklineProps {
  data: number[];
  trend: 'up' | 'down' | 'flat';
  width?: number;
  height?: number;
}

function Sparkline({ data, trend, width = 200, height = 40 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const strokeColor =
    trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';
  const fillColor =
    trend === 'up'
      ? 'url(#gradient-green)'
      : trend === 'down'
      ? 'url(#gradient-red)'
      : 'url(#gradient-gray)';

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradient-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradient-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradient-gray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b7280" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={fillColor} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      {/* End point */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function formatKPIValue(
  value: number,
  format: 'currency' | 'percent' | 'number' | 'units',
  locale: 'en' | 'vi'
): string {
  switch (format) {
    case 'currency':
      if (locale === 'vi') {
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B VND`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M VND`;
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(value);
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: value >= 1e6 ? 'compact' : 'standard',
      }).format(value);

    case 'percent':
      return `${value.toFixed(1)}%`;

    case 'number':
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value);

    case 'units':
      return `${new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value)} units`;

    default:
      return String(value);
  }
}

export default KPITrendChart;
