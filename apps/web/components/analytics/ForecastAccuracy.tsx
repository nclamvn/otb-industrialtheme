'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-5: ForecastAccuracy — Forecast vs Actual Analysis
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ForecastPoint } from '@/hooks/useAnalytics';
import { Target, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface ForecastAccuracyProps {
  forecastData: ForecastPoint[];
  accuracy: {
    mape: number;
    bias: number;
    accuracy: number;
  };
  className?: string;
}

// ─── Forecast Accuracy Component ────────────────────────────────────────────────
export function ForecastAccuracy({
  forecastData,
  accuracy,
  className,
}: ForecastAccuracyProps) {
  // Split data into actual and forecast-only periods
  const { actualData, forecastOnlyData } = useMemo(() => {
    const actual = forecastData.filter((p) => p.actual !== null);
    const forecastOnly = forecastData.filter((p) => p.actual === null);
    return { actualData: actual, forecastOnlyData: forecastOnly };
  }, [forecastData]);

  const accuracyStatus = getAccuracyStatus(accuracy.accuracy);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" />
          Độ chính xác dự báo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Accuracy Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <AccuracyMetric
            label="Độ chính xác"
            value={`${accuracy.accuracy}%`}
            status={accuracyStatus}
            description="Dựa trên MAPE (Mean Absolute Percentage Error)"
          />
          <AccuracyMetric
            label="MAPE"
            value={`${accuracy.mape}%`}
            status={accuracy.mape < 10 ? 'good' : accuracy.mape < 20 ? 'warning' : 'bad'}
            description="Sai số phần trăm tuyệt đối trung bình"
          />
          <AccuracyMetric
            label="Bias"
            value={`${accuracy.bias > 0 ? '+' : ''}${accuracy.bias}%`}
            status={Math.abs(accuracy.bias) < 5 ? 'good' : Math.abs(accuracy.bias) < 10 ? 'warning' : 'bad'}
            description={accuracy.bias > 0 ? 'Dự báo cao hơn thực tế' : 'Dự báo thấp hơn thực tế'}
          />
        </div>

        {/* Chart */}
        <div className="h-48">
          <ForecastChart data={forecastData} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Thực tế</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-amber-500" />
            <span>Dự báo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-500/20 rounded" />
            <span>Khoảng tin cậy</span>
          </div>
        </div>

        {/* Upcoming Forecast Summary */}
        {forecastOnlyData.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Dự báo sắp tới</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {forecastOnlyData.slice(0, 4).map((point) => (
                <div key={point.week} className="p-2 bg-muted/50 rounded text-center">
                  <p className="text-xs text-muted-foreground">{point.week}</p>
                  <p className="font-medium">{formatValue(point.forecast)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatValue(point.lowerBound)} - {formatValue(point.upperBound)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Accuracy Metric Component ──────────────────────────────────────────────────
interface AccuracyMetricProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad';
  description: string;
}

function AccuracyMetric({ label, value, status, description }: AccuracyMetricProps) {
  const StatusIcon =
    status === 'good' ? CheckCircle2 : status === 'warning' ? AlertTriangle : AlertTriangle;
  const statusColor =
    status === 'good'
      ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
      : status === 'warning'
      ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
      : 'text-red-600 bg-red-50 dark:bg-red-900/20';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('p-3 rounded-lg cursor-help', statusColor)}>
            <div className="flex items-center gap-1.5 mb-1">
              <StatusIcon className="w-4 h-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Forecast Chart Component ───────────────────────────────────────────────────
interface ForecastChartProps {
  data: ForecastPoint[];
}

function ForecastChart({ data }: ForecastChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Không có dữ liệu
      </div>
    );
  }

  const width = 600;
  const height = 180;
  const padding = { top: 10, right: 10, bottom: 30, left: 50 };

  // Calculate scales
  const allValues = data.flatMap((d) => [
    d.actual ?? 0,
    d.forecast,
    d.upperBound,
    d.lowerBound,
  ]);
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;

  const xScale = (index: number) =>
    padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  const yScale = (value: number) =>
    padding.top + ((maxVal - value) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

  // Build paths
  const forecastPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(d.forecast)}`)
    .join(' ');

  const actualPath = data
    .filter((d) => d.actual !== null)
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(data.indexOf(d))},${yScale(d.actual!)}`)
    .join(' ');

  const confidencePath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(d.upperBound)}`),
    ...data.map((d, i) => `L ${xScale(data.length - 1 - i)},${yScale(data[data.length - 1 - i].lowerBound)}`),
    'Z',
  ].join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padding.top + tick * (height - padding.top - padding.bottom);
        const value = maxVal - tick * (maxVal - minVal);
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <text
              x={padding.left - 5}
              y={y}
              textAnchor="end"
              alignmentBaseline="middle"
              className="text-[10px] fill-muted-foreground"
            >
              {formatValue(value)}
            </text>
          </g>
        );
      })}

      {/* Confidence band */}
      <path d={confidencePath} fill="rgb(245, 158, 11)" fillOpacity={0.15} />

      {/* Forecast line */}
      <path
        d={forecastPath}
        fill="none"
        stroke="rgb(245, 158, 11)"
        strokeWidth={2}
        strokeDasharray="4 2"
      />

      {/* Actual line */}
      <path d={actualPath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} />

      {/* Actual data points */}
      {data
        .filter((d) => d.actual !== null)
        .map((d, i) => (
          <circle
            key={i}
            cx={xScale(data.indexOf(d))}
            cy={yScale(d.actual!)}
            r={4}
            fill="hsl(var(--primary))"
          />
        ))}

      {/* X-axis labels */}
      {data
        .filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)
        .map((d, i, arr) => (
          <text
            key={i}
            x={xScale(data.indexOf(d))}
            y={height - 5}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {d.week}
          </text>
        ))}

      {/* Divider line between actual and forecast */}
      {data.some((d) => d.actual !== null) && data.some((d) => d.actual === null) && (
        <line
          x1={xScale(data.filter((d) => d.actual !== null).length - 1)}
          y1={padding.top}
          x2={xScale(data.filter((d) => d.actual !== null).length - 1)}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function getAccuracyStatus(accuracy: number): 'good' | 'warning' | 'bad' {
  if (accuracy >= 90) return 'good';
  if (accuracy >= 80) return 'warning';
  return 'bad';
}

function formatValue(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
}

export default ForecastAccuracy;
