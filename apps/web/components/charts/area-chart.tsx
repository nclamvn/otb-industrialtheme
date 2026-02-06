'use client';

import * as React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { chartTheme, rechartsConfig, chartFormatters } from '@/lib/chart-theme';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AreaSeries {
  dataKey: string;
  name: string;
  color?: string;
  fillOpacity?: number;
  stackId?: string;
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  series: AreaSeries[];

  // Formatting
  xAxisFormatter?: (value: unknown) => string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;

  // Options
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  gradient?: boolean;

  // Reference lines
  referenceLine?: { y: number; label: string; color?: string };

  // Styling
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
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
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
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

export function AreaChart({
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
  stacked = false,
  gradient = true,
  referenceLine,
  className,
}: AreaChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {/* Gradient definitions */}
          {gradient && (
            <defs>
              {series.map((s, i) => {
                const color = s.color || chartTheme.series[i % chartTheme.series.length];
                return (
                  <linearGradient key={s.dataKey} id={`gradient-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
          )}

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

          {/* Areas */}
          {series.map((s, i) => {
            const color = s.color || chartTheme.series[i % chartTheme.series.length];
            return (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={color}
                strokeWidth={2}
                fill={gradient ? `url(#gradient-${s.dataKey})` : color}
                fillOpacity={s.fillOpacity ?? (gradient ? 1 : 0.1)}
                stackId={stacked ? 'stack' : s.stackId}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { AreaChartProps, AreaSeries };
