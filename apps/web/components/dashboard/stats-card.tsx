'use client';

import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  FileText,
  Package,
  Building2,
  FolderTree,
  MapPin,
  Users,
  BarChart3,
  Target,
  Activity,
  Percent,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

// Icon mapping for server component compatibility
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  FileText,
  Package,
  Building2,
  FolderTree,
  MapPin,
  Users,
  BarChart3,
  Target,
  Activity,
  Percent,
  ShoppingCart,
};

export type IconName = keyof typeof iconMap;

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: IconName;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
  sparklineData?: number[];
}

// Flat design color system
const colorClasses = {
  blue: {
    icon: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-950',
    border: 'border-l-blue-500',
    sparkline: '#3b82f6',
  },
  green: {
    icon: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-950',
    border: 'border-l-green-500',
    sparkline: '#22c55e',
  },
  orange: {
    icon: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-950',
    border: 'border-l-amber-500',
    sparkline: '#f59e0b',
  },
  purple: {
    icon: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-950',
    border: 'border-l-purple-500',
    sparkline: '#8b5cf6',
  },
  red: {
    icon: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-950',
    border: 'border-l-red-500',
    sparkline: '#ef4444',
  },
  yellow: {
    icon: 'text-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-950',
    border: 'border-l-yellow-500',
    sparkline: '#eab308',
  },
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  const stepX = width / (data.length - 1);

  const points = data
    .map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  color = 'blue',
  sparklineData,
}: StatsCardProps) {
  const colors = colorClasses[color];
  const Icon = iconMap[icon] || DollarSign;

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  // Flat design trend colors
  const trendColor = trend
    ? trend.value > 0
      ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
      : trend.value < 0
      ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
      : 'text-slate-500 bg-muted/50 dark:text-neutral-400 dark:bg-neutral-900'
    : '';

  return (
    <div
      className={cn(
        // Flat design: no shadow, solid bg, left border accent
        'relative rounded-xl border border-border bg-card overflow-hidden',
        'hover:border-border/80 transition-all duration-200',
        'border-l-4',
        colors.border
      )}
    >
      {/* Watermark Icon - Large, faded into background */}
      <div className="absolute -right-4 -bottom-4 pointer-events-none">
        <Icon className={cn('w-24 h-24 opacity-[0.08]', colors.icon)} />
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="space-y-1 pr-14">
          {/* Title */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>

          {/* Value + Trend */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
            {trend && TrendIcon && (
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium',
                trendColor
              )}>
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && (
            <div className="mt-1">
              <MiniSparkline data={sparklineData} color={colors.sparkline} />
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}

          {/* Trend label */}
          {trend && (
            <p className="text-xs text-muted-foreground/70">{trend.label}</p>
          )}
        </div>
      </div>
    </div>
  );
}
