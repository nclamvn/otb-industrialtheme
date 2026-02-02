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
  variant?: 'blue' | 'purple' | 'green' | 'amber' | 'orange' | 'gold' | 'default';
  sparklineData?: number[];
  status?: 'success' | 'warning' | 'critical' | 'info';
  className?: string;
}

// Flat design - solid colors, no gradients
const variantStyles = {
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-500',
  },
  purple: {
    border: 'border-l-purple-500',
    iconBg: 'bg-purple-100 dark:bg-purple-950',
    iconColor: 'text-purple-500',
  },
  green: {
    border: 'border-l-green-500',
    iconBg: 'bg-green-100 dark:bg-green-950',
    iconColor: 'text-green-500',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-500',
  },
  orange: {
    border: 'border-l-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-500',
  },
  gold: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-500',
  },
  default: {
    border: 'border-l-slate-400',
    iconBg: 'bg-muted',
    iconColor: 'text-slate-500',
  },
};

function MiniSparkline({ data, variant }: { data: number[]; variant: keyof typeof variantStyles }) {
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

  const strokeColors: Record<string, string> = {
    blue: '#3b82f6',
    purple: '#a855f7',
    green: '#22c55e',
    amber: '#f59e0b',
    orange: '#f97316',
    gold: '#f59e0b',
    default: '#64748b',
  };

  const strokeColor = strokeColors[variant] || strokeColors.default;

  return (
    <svg width={width} height={height} className="overflow-visible opacity-60">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
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

  // Flat design trend colors
  const trendBadgeClass = trend
    ? trend.value > 0
      ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
      : trend.value < 0
      ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
      : 'text-slate-500 bg-muted/50 dark:text-neutral-400 dark:bg-neutral-900'
    : '';

  // Status ring (flat - no glow/shadow)
  const statusRingClass = status
    ? {
        success: 'ring-2 ring-green-500/30',
        warning: 'ring-2 ring-amber-500/30',
        critical: 'ring-2 ring-red-500/30',
        info: 'ring-2 ring-blue-500/30',
      }[status]
    : '';

  return (
    <div
      className={cn(
        // Flat design: no shadow, solid bg, left border accent
        'relative overflow-hidden rounded-xl border border-border bg-card',
        'hover:border-border/80 transition-all duration-200',
        'border-l-4',
        styles.border,
        statusRingClass,
        className
      )}
    >
      {/* Watermark Icon - Large, faded into background */}
      <div className="absolute -right-4 -bottom-4 pointer-events-none">
        <Icon className={cn('w-24 h-24 opacity-[0.08]', styles.iconColor)} />
      </div>

      {/* Content */}
      <div className="relative p-3">
        <div className="space-y-1 pr-14">
          {/* Label */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>

          {/* Value + Trend */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {value}
            </span>
            {trend && TrendIcon && (
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium',
                trendBadgeClass
              )}>
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>

          {/* Sparkline (inline with value area) */}
          {sparklineData && (
            <div className="mt-1">
              <MiniSparkline data={sparklineData} variant={variant} />
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}

          {/* Trend label */}
          {trend?.label && (
            <p className="text-xs text-muted-foreground/70">{trend.label}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DAFCKPICard;
