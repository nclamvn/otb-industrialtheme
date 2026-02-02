'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

interface SalesTrendData {
  period: string;
  sales: number;
  target?: number;
  lastYear?: number;
}

interface DAFCSalesTrendChartProps {
  data: SalesTrendData[];
  title?: string;
  subtitle?: string;
  variant?: 'line' | 'area';
  showTarget?: boolean;
  showLastYear?: boolean;
  className?: string;
}

// DAFC Colors
const DAFC_GOLD = 'hsl(30 43% 72%)';
const DAFC_GOLD_DARK = 'hsl(30 40% 55%)';
const DAFC_GREEN = 'hsl(152 73% 27%)';
const DAFC_GREEN_LIGHT = 'hsl(152 60% 40%)';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  return (
    <div className="dafc-card p-3 border border-border border-t-2 border-t-[hsl(30_43%_72%)]">
      <p className="font-brand font-semibold text-sm text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-data text-sm font-semibold tabular-nums">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-brand text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function DAFCSalesTrendChart({
  data,
  title = 'Sales Trend',
  subtitle = 'Monthly performance overview',
  variant = 'area',
  showTarget = true,
  showLastYear = false,
  className,
}: DAFCSalesTrendChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn('dafc-card-gold', className)}>
      {/* Header */}
      <div className="dafc-card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-brand font-semibold text-lg text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <div className="dafc-badge dafc-badge-gold">
            <span>Live Data</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="dafc-card-content">
        <div style={{ width: '100%', height: 280, minWidth: 300 }}>
          {!mounted ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-pulse bg-muted rounded w-full h-full" />
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={280} minWidth={300}>
            {variant === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DAFC_GOLD} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={DAFC_GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DAFC_GREEN} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={DAFC_GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke={DAFC_GOLD}
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={{ r: 4, fill: DAFC_GOLD, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: DAFC_GOLD, stroke: '#fff', strokeWidth: 2 }}
                />
                {showTarget && (
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke={DAFC_GREEN}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="url(#targetGradient)"
                    dot={{ r: 3, fill: DAFC_GREEN, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: DAFC_GREEN, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
                {showLastYear && (
                  <Line
                    type="monotone"
                    dataKey="lastYear"
                    name="Last Year"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke={DAFC_GOLD}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: DAFC_GOLD, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: DAFC_GOLD, stroke: '#fff', strokeWidth: 2 }}
                />
                {showTarget && (
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke={DAFC_GREEN}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: DAFC_GREEN, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: DAFC_GREEN, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
                {showLastYear && (
                  <Line
                    type="monotone"
                    dataKey="lastYear"
                    name="Last Year"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default DAFCSalesTrendChart;
