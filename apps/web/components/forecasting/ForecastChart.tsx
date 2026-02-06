'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import type { ForecastResult } from '@/types/forecasting';

interface Props {
  result: ForecastResult;
}

export function ForecastChart({ result }: Props) {
  const chartData = result.weeklyForecast.map((v, i) => ({
    week: `W${i + 1}`,
    forecast: v,
    lower: result.confidence[i]?.lower || 0,
    upper: result.confidence[i]?.upper || 0,
  }));

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip
            formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : String(value))}
            labelFormatter={(label) => `Week ${String(label).replace('W', '')}`}
          />
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#3b82f6"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#ffffff"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
