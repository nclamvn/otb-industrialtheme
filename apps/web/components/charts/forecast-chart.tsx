'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface ForecastDataPoint {
  date: string;
  actual?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
  description?: string;
  confidence?: number;
  accuracy?: {
    mape: number;
    rmse: number;
  };
  formatValue?: (value: number) => string;
  actualColor?: string;
  forecastColor?: string;
  confidenceColor?: string;
}

export function ForecastChart({
  data,
  title,
  description,
  confidence,
  accuracy,
  formatValue = (v) => `$${(v / 1000).toFixed(0)}K`,
  actualColor = 'hsl(var(--primary))',
  forecastColor = '#f59e0b',
  confidenceColor = '#f59e0b',
}: ForecastChartProps) {
  // Find the transition point (last actual data point)
  const transitionIndex = data.findIndex(
    (d) => d.actual === undefined && d.forecast !== undefined
  );
  const transitionDate = transitionIndex > 0 ? data[transitionIndex - 1]?.date : null;

  const content = (
    <div className="space-y-4">
      {/* Accuracy metrics */}
      {(confidence !== undefined || accuracy) && (
        <div className="flex items-center gap-4">
          {confidence !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Confidence: {(confidence * 100).toFixed(0)}%
            </Badge>
          )}
          {accuracy && (
            <>
              <Badge variant="outline" className="gap-1">
                MAPE: {accuracy.mape.toFixed(1)}%
              </Badge>
              <Badge variant="outline" className="gap-1">
                RMSE: {formatValue(accuracy.rmse)}
              </Badge>
            </>
          )}
        </div>
      )}

      {/* Chart */}
      <ChartWrapper height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={confidenceColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={confidenceColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
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
              formatter={(value, name) => [
                formatValue(typeof value === 'number' ? value : 0),
                name === 'actual'
                  ? 'Actual'
                  : name === 'forecast'
                  ? 'Forecast'
                  : String(name ?? ''),
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />

            {/* Confidence band */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="url(#confidenceGradient)"
              name="Upper Bound"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="white"
              name="Lower Bound"
              legendType="none"
            />

            {/* Transition line */}
            {transitionDate && (
              <ReferenceLine
                x={transitionDate}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{
                  value: 'Forecast →',
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                }}
              />
            )}

            {/* Actual line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={actualColor}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke={forecastColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
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
