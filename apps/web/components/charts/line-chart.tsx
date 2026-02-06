'use client';

import * as React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { cn } from '@/lib/utils';
import { chartTheme, rechartsConfig, chartFormatters } from '@/lib/chart-theme';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface LineSeries {
  dataKey: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean;
  activeDot?: boolean;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  series: LineSeries[];

  // Formatting
  xAxisFormatter?: (value: unknown) => string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;

  // Options
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curved?: boolean;

  // Confidence band
  confidenceBand?: {
    lowerKey: string;
    upperKey: string;
    color?: string;
  };

  // Reference
  referenceLine?: { y: number; label: string; color?: string };

  // Styling
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; strokeDasharray?: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div style={rechartsConfig.tooltipContentStyle}>
      <p className="text-content-secondary mb-2 text-xs">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-0.5 rounded"
              style={{
                backgroundColor: entry.color,
                borderStyle: entry.strokeDasharray ? 'dashed' : 'solid',
              }}
            />
            <span className="text-content-secondary text-xs">{entry.name}</span>
          </div>
          <span className="font-data text-content text-xs">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function LineChart({
  data,
  xAxisKey,
  series,
  xAxisFormatter,
  yAxisFormatter = chartFormatters.number,
  tooltipFormatter,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  curved = true,
  confidenceBand,
  referenceLine,
  className,
}: LineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {/* Grid */}
          {showGrid && <CartesianGrid {...rechartsConfig.cartesianGrid} />}

          {/* Axes */}
          <XAxis
            dataKey={xAxisKey}
            {...rechartsConfig.xAxis}
            tickFormatter={xAxisFormatter}
          />
          <YAxis
            {...rechartsConfig.yAxis}
            tickFormatter={yAxisFormatter}
          />

          {/* Tooltip */}
          {showTooltip && (
            <Tooltip
              content={<CustomTooltip formatter={tooltipFormatter || yAxisFormatter} />}
              cursor={{ stroke: chartTheme.colors.grid, strokeDasharray: '3 3' }}
            />
          )}

          {/* Legend */}
          {showLegend && (
            <Legend
              {...rechartsConfig.legend}
              verticalAlign="top"
              height={36}
            />
          )}

          {/* Reference line */}
          {referenceLine && (
            <ReferenceLine
              y={referenceLine.y}
              stroke={referenceLine.color || chartTheme.colors.neutral}
              strokeDasharray="3 3"
              label={{
                value: referenceLine.label,
                fill: chartTheme.colors.axis,
                fontSize: 10,
              }}
            />
          )}

          {/* Confidence band */}
          {confidenceBand && data.map((entry, index) => {
            if (index === 0) return null;
            const prev = data[index - 1];
            return (
              <ReferenceArea
                key={index}
                x1={prev[xAxisKey] as string}
                x2={entry[xAxisKey] as string}
                y1={Math.min(
                  prev[confidenceBand.lowerKey] as number,
                  entry[confidenceBand.lowerKey] as number
                )}
                y2={Math.max(
                  prev[confidenceBand.upperKey] as number,
                  entry[confidenceBand.upperKey] as number
                )}
                fill={confidenceBand.color || chartTheme.colors.primary}
                fillOpacity={0.1}
                strokeOpacity={0}
              />
            );
          })}

          {/* Lines */}
          {series.map((s, i) => {
            const color = s.color || chartTheme.series[i % chartTheme.series.length];
            return (
              <Line
                key={s.dataKey}
                type={curved ? 'monotone' : 'linear'}
                dataKey={s.dataKey}
                name={s.name}
                stroke={color}
                strokeWidth={s.strokeWidth ?? 2}
                strokeDasharray={s.strokeDasharray}
                dot={s.dot ?? false}
                activeDot={s.activeDot !== false ? {
                  r: 4,
                  fill: color,
                  stroke: chartTheme.colors.tooltipBg,
                  strokeWidth: 2,
                } : false}
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND LINE CHART (Preset for actual vs plan vs LY)
// ═══════════════════════════════════════════════════════════════════════════════

interface TrendLineChartProps {
  data: Array<{
    period: string;
    actual?: number;
    plan?: number;
    lastYear?: number;
    [key: string]: unknown;
  }>;
  height?: number;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function TrendLineChart({
  data,
  height = 250,
  showLegend = true,
  valueFormatter = chartFormatters.currency,
  className,
}: TrendLineChartProps) {
  const series: LineSeries[] = [
    {
      dataKey: 'actual',
      name: 'Actual',
      color: chartTheme.colors.primary,
      strokeWidth: 2,
      dot: true,
    },
    {
      dataKey: 'plan',
      name: 'Plan',
      color: chartTheme.colors.secondary,
      strokeDasharray: '5 5',
      strokeWidth: 2,
    },
    {
      dataKey: 'lastYear',
      name: 'LY',
      color: chartTheme.colors.neutral,
      strokeDasharray: '2 2',
      strokeWidth: 1,
    },
  ];

  // Filter series to only include those with data
  const activeSeries = series.filter(s =>
    data.some(d => d[s.dataKey] !== undefined)
  );

  return (
    <LineChart
      data={data}
      xAxisKey="period"
      series={activeSeries}
      height={height}
      showLegend={showLegend}
      yAxisFormatter={valueFormatter}
      tooltipFormatter={valueFormatter}
      className={className}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORECAST LINE CHART (With confidence band)
// ═══════════════════════════════════════════════════════════════════════════════

interface ForecastLineChartProps {
  data: Array<{
    period: string;
    actual?: number;
    forecast?: number;
    forecastLower?: number;
    forecastUpper?: number;
    [key: string]: unknown;
  }>;
  height?: number;
  showLegend?: boolean;
  showConfidenceBand?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function ForecastLineChart({
  data,
  height = 300,
  showLegend = true,
  showConfidenceBand = true,
  valueFormatter = chartFormatters.currency,
  className,
}: ForecastLineChartProps) {
  const series: LineSeries[] = [
    {
      dataKey: 'actual',
      name: 'Actual',
      color: chartTheme.colors.primary,
      strokeWidth: 2,
      dot: true,
    },
    {
      dataKey: 'forecast',
      name: 'Forecast',
      color: chartTheme.colors.tertiary,
      strokeDasharray: '5 5',
      strokeWidth: 2,
    },
  ];

  // Filter series to only include those with data
  const activeSeries = series.filter(s =>
    data.some(d => d[s.dataKey] !== undefined)
  );

  return (
    <LineChart
      data={data}
      xAxisKey="period"
      series={activeSeries}
      height={height}
      showLegend={showLegend}
      yAxisFormatter={valueFormatter}
      tooltipFormatter={valueFormatter}
      confidenceBand={showConfidenceBand ? {
        lowerKey: 'forecastLower',
        upperKey: 'forecastUpper',
        color: chartTheme.colors.tertiary,
      } : undefined}
      className={className}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { LineChartProps, LineSeries, TrendLineChartProps, ForecastLineChartProps };
