'use client';

import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ShoppingCart,
  Package,
  Target,
  Percent,
  BarChart3,
  Users,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { BudgetStatusBadge, BudgetCardStatus } from '@/components/ui/budget';

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  ShoppingCart,
  Package,
  Target,
  Percent,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
};

export type DAFCIconName = keyof typeof iconMap;

interface DAFCKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: DAFCIconName;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'blue' | 'purple' | 'green' | 'amber' | 'gold' | 'default';
  sparklineData?: number[];
  status?: 'success' | 'warning' | 'critical' | 'info';
  className?: string;
}

// Unified level-based border colors matching design system
const variantStyles = {
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600',
    gradient: 'from-blue-50/50',
  },
  purple: {
    border: 'border-l-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-950',
    iconColor: 'text-purple-600',
    gradient: 'from-purple-50/50',
  },
  green: {
    border: 'border-l-green-500',
    iconBg: 'bg-green-50 dark:bg-green-950',
    iconColor: 'text-green-600',
    gradient: 'from-green-50/50',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-600',
    gradient: 'from-amber-50/50',
  },
  // Legacy aliases for backward compatibility
  gold: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-600',
    gradient: 'from-amber-50/50',
  },
  default: {
    border: 'border-l-slate-600',
    iconBg: 'bg-slate-100 dark:bg-neutral-950',
    iconColor: 'text-slate-600',
    gradient: 'from-slate-50/50',
  },
};

function MiniSparkline({ data, variant }: { data: number[]; variant: 'blue' | 'purple' | 'green' | 'amber' | 'gold' | 'default' }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 28;
  const width = 70;
  const stepX = width / (data.length - 1);

  const points = data
    .map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColors: Record<string, string> = {
    blue: '#3b82f6',
    purple: '#a855f7',
    green: '#22c55e',
    amber: '#f59e0b',
    gold: '#f59e0b',
    default: '#64748b',
  };

  const strokeColor = strokeColors[variant] || strokeColors.default;

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80">
      <defs>
        <linearGradient id={`sparkline-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={`url(#sparkline-grad-${variant})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function DAFCKPICard({
  title,
  value,
  subtitle,
  icon = 'DollarSign',
  trend,
  variant = 'default',
  sparklineData,
  status,
  className,
}: DAFCKPICardProps) {
  const Icon = iconMap[icon] || DollarSign;
  const styles = variantStyles[variant];

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  // Unified health-based trend colors
  const trendBadgeClass = trend
    ? trend.value > 0
      ? 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800'
      : trend.value < 0
      ? 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800'
      : 'text-slate-600 bg-slate-50 border-slate-200 dark:text-neutral-400 dark:bg-neutral-900 dark:border-neutral-700'
    : '';

  // Status glow using unified colors
  const statusGlowClass = status
    ? {
        success: 'ring-2 ring-green-200 dark:ring-green-800',
        warning: 'ring-2 ring-amber-200 dark:ring-amber-800',
        critical: 'ring-2 ring-red-200 dark:ring-red-800',
        info: 'ring-2 ring-blue-200 dark:ring-blue-800',
      }[status]
    : '';

  return (
    <div
      className={cn(
        // Unified: rounded-xl, p-4, shadow-sm, hover:shadow-md, border-l-4
        'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'border-l-4',
        styles.border,
        statusGlowClass,
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-br to-transparent',
          styles.gradient
        )}
      />

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left content */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Label */}
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {title}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-neutral-100">
                {value}
              </span>
              {trend && TrendIcon && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium border',
                  trendBadgeClass
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{subtitle}</p>
            )}

            {/* Trend label */}
            {trend?.label && (
              <p className="text-xs text-slate-400 dark:text-neutral-500">{trend.label}</p>
            )}
          </div>

          {/* Right content - Icon and Sparkline */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Unified: w-10 h-10 rounded-xl icon container */}
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', styles.iconBg)}>
              <Icon className={cn('h-5 w-5', styles.iconColor)} />
            </div>

            {/* Sparkline */}
            {sparklineData && (
              <MiniSparkline data={sparklineData} variant={variant} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DAFCKPICard;
