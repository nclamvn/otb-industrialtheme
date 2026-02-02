'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkline } from '@/components/analytics/sparkline';
import { TrendingUp, TrendingDown, MoreHorizontal, DollarSign, Percent, Hash, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  status?: 'success' | 'warning' | 'error';
  format?: 'number' | 'currency' | 'percent';
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

const accentColors = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
  purple: 'border-l-purple-500',
};

const defaultIcons: Record<string, LucideIcon> = {
  currency: DollarSign,
  percent: Percent,
  number: Hash,
};

export function DashboardCard({
  title,
  value,
  change,
  trend = 'neutral',
  sparklineData,
  status,
  format = 'number',
  accent = 'blue',
  icon,
  onClick,
  className,
}: DashboardCardProps) {
  const WatermarkIcon = icon || defaultIcons[format] || Hash;
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        if (val >= 1000000) {
          return `$${(val / 1000000).toFixed(1)}M`;
        }
        if (val >= 1000) {
          return `$${(val / 1000).toFixed(0)}K`;
        }
        return `$${val.toFixed(0)}`;
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:border-border/80 border-l-4',
        accentColors[accent],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <button className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </CardHeader>

      <CardContent>
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {formatValue(value)}
            </p>

            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
              )}>
                {TrendIcon && <TrendIcon className="h-4 w-4" />}
                <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
                <span className="text-muted-foreground font-normal">vs last period</span>
              </div>
            )}
          </div>

          {sparklineData && sparklineData.length > 0 && (
            <div className="w-24 h-10">
              <Sparkline data={sparklineData} trend={trend} />
            </div>
          )}
        </div>

        {/* Status indicator */}
        {status && (
          <div className="absolute top-4 right-12">
            <div className={cn(
              'w-2 h-2 rounded-full',
              status === 'success' && 'bg-success-500',
              status === 'warning' && 'bg-warning-500',
              status === 'error' && 'bg-error-500'
            )} />
          </div>
        )}

        {/* Watermark icon */}
        <WatermarkIcon className="absolute bottom-4 right-4 w-24 h-24 text-muted-foreground opacity-[0.08]" />
      </CardContent>
    </Card>
  );
}
