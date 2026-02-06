'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface RadarDataPoint {
  axis: string;
  [key: string]: number | string;
}

interface RadarSeries {
  dataKey: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  series: RadarSeries[];
  title?: string;
  description?: string;
  showLegend?: boolean;
  maxValue?: number;
}

export function RadarChart({
  data,
  series,
  title,
  description,
  showLegend = true,
  maxValue,
}: RadarChartProps) {
  const content = (
    <ChartWrapper height={350}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid className="stroke-muted" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, maxValue || 'auto']}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />

          {series.map((s) => (
            <Radar
              key={s.dataKey}
              name={s.name}
              dataKey={s.dataKey}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity ?? 0.3}
              strokeWidth={2}
            />
          ))}

          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          {showLegend && <Legend />}
        </RechartsRadarChart>
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
