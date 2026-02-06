'use client';

import * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { chartTheme, rechartsConfig, chartFormatters } from '@/lib/chart-theme';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface BarSeries {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
  radius?: number | [number, number, number, number];
}

interface BarChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  series: BarSeries[];

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
  horizontal?: boolean;
  barSize?: number;

  // Conditional coloring
  colorByValue?: (value: number, entry: Record<string, unknown>) => string;

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
  payload?: Array<{ name: string; value: number; color?: string; fill?: string }>;
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
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: entry.color || entry.fill }}
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

export function BarChart({
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
  horizontal = false,
  barSize,
  colorByValue,
  referenceLine,
  className,
}: BarChartProps) {
  // Swap axes for horizontal
  const XAxisComponent = horizontal ? YAxis : XAxis;
  const YAxisComponent = horizontal ? XAxis : YAxis;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              {...rechartsConfig.cartesianGrid}
              horizontal={!horizontal}
              vertical={horizontal}
            />
          )}

          {/* X Axis */}
          <XAxisComponent
            dataKey={horizontal ? undefined : xAxisKey}
            type={horizontal ? 'number' : 'category'}
            {...rechartsConfig.xAxis}
            tickFormatter={horizontal ? yAxisFormatter : xAxisFormatter}
          />

          {/* Y Axis */}
          <YAxisComponent
            dataKey={horizontal ? xAxisKey : undefined}
            type={horizontal ? 'category' : 'number'}
            {...rechartsConfig.yAxis}
            tickFormatter={horizontal ? xAxisFormatter : yAxisFormatter}
          />

          {/* Tooltip */}
          {showTooltip && (
            <Tooltip
              content={<CustomTooltip formatter={tooltipFormatter || yAxisFormatter} />}
              cursor={{ fill: chartTheme.colors.grid, fillOpacity: 0.1 }}
            />
          )}

          {/* Legend */}
          {showLegend && series.length > 1 && (
            <Legend
              {...rechartsConfig.legend}
              verticalAlign="top"
              height={36}
            />
          )}

          {/* Reference line */}
          {referenceLine && (
            <ReferenceLine
              y={horizontal ? undefined : referenceLine.y}
              x={horizontal ? referenceLine.y : undefined}
              stroke={referenceLine.color || chartTheme.colors.neutral}
              strokeDasharray="3 3"
              label={{
                value: referenceLine.label,
                fill: chartTheme.colors.axis,
                fontSize: 10,
              }}
            />
          )}

          {/* Bars */}
          {series.map((s, i) => {
            const color = s.color || chartTheme.series[i % chartTheme.series.length];
            return (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={color}
                stackId={stacked ? 'stack' : s.stackId}
                radius={s.radius ?? [2, 2, 0, 0]}
                barSize={barSize}
              >
                {/* Conditional coloring */}
                {colorByValue && data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={colorByValue(entry[s.dataKey] as number, entry)}
                  />
                ))}
              </Bar>
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANCE BAR CHART (Shows positive/negative variance)
// ═══════════════════════════════════════════════════════════════════════════════

interface VarianceBarChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: unknown;
  }>;
  height?: number;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function VarianceBarChart({
  data,
  height = 200,
  valueFormatter = chartFormatters.currency,
  className,
}: VarianceBarChartProps) {
  return (
    <BarChart
      data={data}
      xAxisKey="name"
      series={[{ dataKey: 'value', name: 'Variance' }]}
      height={height}
      showLegend={false}
      yAxisFormatter={valueFormatter}
      tooltipFormatter={valueFormatter}
      colorByValue={(value) =>
        value >= 0 ? chartTheme.colors.positive : chartTheme.colors.negative
      }
      referenceLine={{ y: 0, label: '', color: chartTheme.colors.neutral }}
      className={className}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { BarChartProps, BarSeries, VarianceBarChartProps };
