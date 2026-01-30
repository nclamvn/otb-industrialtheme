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
import { formatBudgetCurrency } from '@/components/ui/budget';

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

// Unified color system matching budget card design
const colorClasses = {
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    trend: 'text-blue-600',
    sparkline: '#3b82f6',
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-l-green-500',
    trend: 'text-green-600',
    sparkline: '#22c55e',
  },
  orange: {
    icon: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    trend: 'text-amber-600',
    sparkline: '#f59e0b',
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-l-purple-500',
    trend: 'text-purple-600',
    sparkline: '#8b5cf6',
  },
  red: {
    icon: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    trend: 'text-red-600',
    sparkline: '#ef4444',
  },
  yellow: {
    icon: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-l-yellow-500',
    trend: 'text-yellow-600',
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
    <svg width={width} height={height} className="overflow-visible">
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

  // Unified health-based trend colors
  const trendColor = trend
    ? trend.value > 0
      ? 'text-green-600 bg-green-50'
      : trend.value < 0
      ? 'text-red-600 bg-red-50'
      : 'text-slate-500 bg-slate-50'
    : '';

  return (
    <div
      className={cn(
        // Unified: rounded-xl, p-4, shadow-sm, hover:shadow-md, border-l-4
        'rounded-xl border border-slate-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'border-l-4',
        colors.border
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{value}</span>
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
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
            {trend && (
              <p className="text-xs text-slate-500">{trend.label}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Unified: w-10 h-10 rounded-xl icon container */}
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', colors.bg)}>
              <Icon className={cn('h-5 w-5', colors.icon)} />
            </div>
            {sparklineData && (
              <MiniSparkline data={sparklineData} color={colors.sparkline} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
