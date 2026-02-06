'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { chartTheme } from '@/lib/chart-theme';

interface TrendChartProps {
  data: Array<{
    period: string;
    actual?: number;
    plan?: number;
    ly?: number;
  }>;
  height?: number;
  showLegend?: boolean;
}

export function TrendChart({ data, height = 280, showLegend = true }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          stroke={chartTheme.grid.stroke}
          strokeDasharray={chartTheme.grid.strokeDasharray}
          vertical={false}
        />
        <XAxis
          dataKey="period"
          axisLine={{ stroke: chartTheme.axis.stroke }}
          tickLine={false}
          tick={chartTheme.axis.tick}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={chartTheme.axis.tick}
          dx={-8}
        />
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          itemStyle={chartTheme.tooltip.itemStyle}
        />
        {showLegend && (
          <Legend
            wrapperStyle={chartTheme.legend.wrapperStyle}
            iconSize={chartTheme.legend.iconSize}
          />
        )}
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke={chartTheme.colors.primary}
          strokeWidth={2}
          dot={{ r: 3, fill: chartTheme.colors.primary }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="plan"
          name="Plan"
          stroke={chartTheme.colors.tertiary}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="ly"
          name="LY"
          stroke={chartTheme.colors.neutral}
          strokeWidth={1}
          strokeDasharray="2 2"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
