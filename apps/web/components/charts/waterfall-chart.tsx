'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useMemo } from 'react';

interface WaterfallItem {
  name: string;
  value: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

interface WaterfallChartProps {
  data: WaterfallItem[];
  title?: string;
  description?: string;
  formatValue?: (value: number) => string;
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
}

export function WaterfallChart({
  data,
  title,
  description,
  formatValue = (v) => `$${(v / 1000).toFixed(0)}K`,
  positiveColor = '#22c55e',
  negativeColor = '#ef4444',
  totalColor = '#3b82f6',
}: WaterfallChartProps) {
  const chartData = useMemo(() => {
    let cumulative = 0;

    return data.map((item) => {
      if (item.isTotal || item.isSubtotal) {
        return {
          name: item.name,
          start: 0,
          end: cumulative,
          value: cumulative,
          isTotal: true,
          isSubtotal: item.isSubtotal,
        };
      }

      const start = cumulative;
      cumulative += item.value;

      return {
        name: item.name,
        start: item.value >= 0 ? start : cumulative,
        end: item.value >= 0 ? cumulative : start,
        value: item.value,
        isPositive: item.value >= 0,
      };
    });
  }, [data]);

  const content = (
    <ChartWrapper height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [formatValue(typeof value === 'number' ? value : 0), 'Value']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />

          {/* Invisible bar for positioning */}
          <Bar dataKey="start" stackId="a" fill="transparent" />

          {/* Actual value bar */}
          <Bar dataKey={(d) => Math.abs(d.end - d.start)} stackId="a" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isTotal || entry.isSubtotal
                    ? totalColor
                    : entry.isPositive
                    ? positiveColor
                    : negativeColor
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );

  if (title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return content;
}
