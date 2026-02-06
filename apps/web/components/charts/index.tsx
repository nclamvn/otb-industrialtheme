'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartWrapper } from '@/components/ui/chart-wrapper';

// Default colors for charts
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

// Pie Chart Component
interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export function PieChartComponent({
  data,
  title,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
}: PieChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartWrapper height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data as Array<{ name: string; value: number; [key: string]: unknown }>}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`$${typeof value === 'number' ? value.toLocaleString() : value}`, 'Value']}
              />
              {showLegend && <Legend />}
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}

// Bar Chart Component
interface BarChartDataItem {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartDataItem[];
  title?: string;
  height?: number;
  bars: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  showLegend?: boolean;
  stacked?: boolean;
}

export function BarChartComponent({
  data,
  title,
  height = 300,
  bars,
  showLegend = true,
  stacked = false,
}: BarChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartWrapper height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              {bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.color || COLORS[index % COLORS.length]}
                  stackId={stacked ? 'stack' : undefined}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}

// Line Chart Component
interface LineChartDataItem {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartDataItem[];
  title?: string;
  height?: number;
  lines: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  showLegend?: boolean;
  showArea?: boolean;
}

export function LineChartComponent({
  data,
  title,
  height = 300,
  lines,
  showLegend = true,
  showArea = false,
}: LineChartProps) {
  if (showArea) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ChartWrapper height={height}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                {showLegend && <Legend />}
                {lines.map((line, index) => (
                  <Area
                    key={line.dataKey}
                    type="monotone"
                    dataKey={line.dataKey}
                    name={line.name}
                    stroke={line.color || COLORS[index % COLORS.length]}
                    fill={line.color || COLORS[index % COLORS.length]}
                    fillOpacity={0.2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartWrapper height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              {lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color || COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}

// Size Curve Chart Component
interface SizeCurveDataItem {
  size: string;
  percentage: number;
  quantity?: number;
}

interface SizeCurveChartProps {
  data: SizeCurveDataItem[];
  title?: string;
  height?: number;
  showQuantity?: boolean;
}

export function SizeCurveChart({
  data,
  title = 'Size Curve',
  height = 250,
  showQuantity = false,
}: SizeCurveChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartWrapper height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="size" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `${value}%`}
                domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(value, name) => {
                  const v = typeof value === 'number' ? value : 0;
                  return [
                    name === 'percentage' ? `${v}%` : v.toLocaleString(),
                    name === 'percentage' ? 'Distribution' : 'Quantity',
                  ];
                }}
              />
              <Bar
                dataKey="percentage"
                name="Distribution %"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              {showQuantity && (
                <Bar
                  dataKey="quantity"
                  name="Quantity"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}

// Budget Comparison Chart
interface BudgetComparisonItem {
  category: string;
  budget: number;
  actual: number;
  variance?: number;
}

interface BudgetComparisonChartProps {
  data: BudgetComparisonItem[];
  title?: string;
  height?: number;
}

export function BudgetComparisonChart({
  data,
  title = 'Budget vs Actual',
  height = 300,
}: BudgetComparisonChartProps) {
  const chartData = data.map((item) => ({
    name: item.category,
    Budget: item.budget,
    Actual: item.actual,
    Variance: item.variance ?? item.actual - item.budget,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartWrapper height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value) => [`$${typeof value === 'number' ? value.toLocaleString() : value}`, '']}
              />
              <Legend />
              <Bar
                dataKey="Budget"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Actual"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}

// OTB Trend Chart
interface OTBTrendItem {
  period: string;
  planned: number;
  committed: number;
  openToBuy: number;
}

interface OTBTrendChartProps {
  data: OTBTrendItem[];
  title?: string;
  height?: number;
}

export function OTBTrendChart({
  data,
  title = 'OTB Trend',
  height = 300,
}: OTBTrendChartProps) {
  const chartData = data.map((item) => ({
    name: item.period,
    Planned: item.planned,
    Committed: item.committed,
    'Open to Buy': item.openToBuy,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartWrapper height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value) => [`$${typeof value === 'number' ? value.toLocaleString() : value}`, '']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Planned"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Committed"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Open to Buy"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}

// Export Sprint 5 Advanced Charts
export { Heatmap } from './heatmap';
export { GaugeChart } from './gauge-chart';
export { WaterfallChart } from './waterfall-chart';
export { RadarChart } from './radar-chart';
export { ForecastChart } from './forecast-chart';

// Export Industrial Precision Charts
export { AreaChart } from './area-chart';
export { BarChart, VarianceBarChart } from './bar-chart';
export { LineChart, TrendLineChart, ForecastLineChart } from './line-chart';
export { TrendChart } from './trend-chart';

// Re-export chart theme utilities
export { chartTheme, rechartsConfig, chartFormatters, getSeriesColor, getStatusColor } from '@/lib/chart-theme';
