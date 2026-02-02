'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SizeDistribution } from '@/types/size-profile';

interface SizeDistributionChartProps {
  data: SizeDistribution[];
  title?: string;
  height?: number;
  showValues?: boolean;
  highlightedSizes?: string[];
  color?: string;
}

export function SizeDistributionChart({
  data,
  title = 'Size Distribution',
  height = 250,
  showValues = true,
  highlightedSizes = [],
  color = '#8884d8',
}: SizeDistributionChartProps) {
  const chartData = data.map((item) => ({
    name: item.sizeCode,
    fullName: item.sizeName,
    value: item.percentage,
    isHighlighted: highlightedSizes.includes(item.sizeCode),
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { fullName: string; value: number } }[] }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-2 border-2 border-border">
          <p className="font-medium">{item.fullName}</p>
          <p className="text-sm text-muted-foreground">{item.value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isHighlighted ? '#ef4444' : color}
                  opacity={entry.isHighlighted ? 1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {showValues && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {data.map((item) => (
              <div
                key={item.sizeId}
                className="text-center px-2 py-1 bg-muted rounded text-xs"
              >
                <span className="font-medium">{item.sizeCode}</span>
                <span className="text-muted-foreground ml-1">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
