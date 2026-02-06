'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-5: SeasonComparison — Season-over-Season Analysis
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';
import { SeasonData } from '@/hooks/useAnalytics';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface SeasonComparisonProps {
  seasonData: SeasonData[];
  comparison: {
    current: SeasonData;
    compare: SeasonData;
    changes: {
      revenue: number;
      margin: number;
      units: number;
      sellThrough: number;
    };
  } | null;
  compareMode: boolean;
  compareSeason: string | null;
  onCompareModeChange: (enabled: boolean) => void;
  onCompareSeasonChange: (season: string | null) => void;
  className?: string;
}

// ─── Season Comparison Component ────────────────────────────────────────────────
export function SeasonComparison({
  seasonData,
  comparison,
  compareMode,
  compareSeason,
  onCompareModeChange,
  onCompareSeasonChange,
  className,
}: SeasonComparisonProps) {
  const currentSeason = seasonData[0];
  const previousSeasons = seasonData.slice(1);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          So sánh mùa
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">So sánh với:</span>
          <Select
            value={compareSeason || '_none'}
            onValueChange={(value) => {
              if (value === '_none') {
                onCompareSeasonChange(null);
                onCompareModeChange(false);
              } else {
                onCompareSeasonChange(value);
                onCompareModeChange(true);
              }
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chọn mùa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Không so sánh</SelectItem>
              {previousSeasons.map((season) => (
                <SelectItem key={season.season} value={season.season}>
                  {season.season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Season Summary */}
        {currentSeason && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default">{currentSeason.season}</Badge>
              <span className="text-sm text-muted-foreground">Mùa hiện tại</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricBox
                label="Doanh thu"
                value={formatCurrency(currentSeason.revenue)}
                comparison={comparison?.changes.revenue}
              />
              <MetricBox
                label="Biên lợi nhuận"
                value={`${currentSeason.margin.toFixed(1)}%`}
                comparison={comparison?.changes.margin}
                isPercentageChange
              />
              <MetricBox
                label="Số lượng"
                value={formatNumber(currentSeason.units)}
                comparison={comparison?.changes.units}
              />
              <MetricBox
                label="Sell-through"
                value={`${currentSeason.sellThrough.toFixed(1)}%`}
                comparison={comparison?.changes.sellThrough}
                isPercentageChange
              />
            </div>
          </div>
        )}

        {/* Comparison Details */}
        {comparison && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">{comparison.compare.season}</Badge>
              <span className="text-sm text-muted-foreground">vs</span>
              <Badge variant="default">{comparison.current.season}</Badge>
            </div>
            <ComparisonTable current={comparison.current} compare={comparison.compare} />
          </div>
        )}

        {/* Season Bars */}
        {!compareMode && seasonData.length > 1 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-3">Doanh thu theo mùa</p>
            <div className="space-y-2">
              {seasonData.map((season, index) => {
                const maxRevenue = Math.max(...seasonData.map((s) => s.revenue));
                const percentage = (season.revenue / maxRevenue) * 100;
                return (
                  <div key={season.season} className="flex items-center gap-3">
                    <span className="text-sm w-24 truncate">{season.season}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded transition-all',
                          index === 0 ? 'bg-primary' : 'bg-primary/40'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">
                      {formatCurrency(season.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Metric Box Component ───────────────────────────────────────────────────────
interface MetricBoxProps {
  label: string;
  value: string;
  comparison?: number;
  isPercentageChange?: boolean;
}

function MetricBox({ label, value, comparison, isPercentageChange }: MetricBoxProps) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {comparison !== undefined && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs mt-1',
            comparison > 0 ? 'text-green-600' : comparison < 0 ? 'text-red-600' : 'text-muted-foreground'
          )}
        >
          {comparison > 0 ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : comparison < 0 ? (
            <ArrowDownRight className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          <span>
            {comparison > 0 ? '+' : ''}
            {isPercentageChange
              ? `${comparison.toFixed(1)}pp`
              : `${comparison.toFixed(1)}%`}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Comparison Table Component ─────────────────────────────────────────────────
interface ComparisonTableProps {
  current: SeasonData;
  compare: SeasonData;
}

function ComparisonTable({ current, compare }: ComparisonTableProps) {
  const metrics = [
    { label: 'Doanh thu', currentVal: current.revenue, compareVal: compare.revenue, format: 'currency' },
    { label: 'Chi phí', currentVal: current.cost, compareVal: compare.cost, format: 'currency' },
    { label: 'Biên lợi nhuận', currentVal: current.margin, compareVal: compare.margin, format: 'percent' },
    { label: 'Số lượng', currentVal: current.units, compareVal: compare.units, format: 'number' },
    { label: 'Sell-through', currentVal: current.sellThrough, compareVal: compare.sellThrough, format: 'percent' },
    { label: 'Tỷ lệ markdown', currentVal: current.markdownRate, compareVal: compare.markdownRate, format: 'percent' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Chỉ số</th>
            <th className="text-right py-2">{compare.season}</th>
            <th className="text-right py-2">{current.season}</th>
            <th className="text-right py-2">Thay đổi</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const change =
              metric.format === 'percent'
                ? metric.currentVal - metric.compareVal
                : ((metric.currentVal - metric.compareVal) / metric.compareVal) * 100;
            const isGood =
              metric.label === 'Chi phí' || metric.label === 'Tỷ lệ markdown'
                ? change < 0
                : change > 0;

            return (
              <tr key={metric.label} className="border-b border-muted">
                <td className="py-2">{metric.label}</td>
                <td className="text-right py-2 text-muted-foreground">
                  {formatMetric(metric.compareVal, metric.format)}
                </td>
                <td className="text-right py-2 font-medium">
                  {formatMetric(metric.currentVal, metric.format)}
                </td>
                <td
                  className={cn(
                    'text-right py-2',
                    isGood ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {change > 0 ? '+' : ''}
                  {metric.format === 'percent' ? `${change.toFixed(1)}pp` : `${change.toFixed(1)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return `${(value / 1e3).toFixed(0)}K`;
}

function formatNumber(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString('vi-VN');
}

function formatMetric(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
      return formatNumber(value);
    default:
      return String(value);
  }
}

export default SeasonComparison;
