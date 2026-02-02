'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-6: MobileDataCard — Touch-Optimized Data Display
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// ─── Props ──────────────────────────────────────────────────────────────────────
interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  statusText?: string;
  badge?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  actions?: { label: string; onClick: () => void; icon?: React.ReactNode; destructive?: boolean }[];
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// ─── Status Colors ──────────────────────────────────────────────────────────────
const statusColors = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

// ─── Mobile Data Card Component ─────────────────────────────────────────────────
export function MobileDataCard({
  title,
  subtitle,
  value,
  trend,
  trendValue,
  status,
  statusText,
  badge,
  leftIcon,
  rightIcon,
  actions,
  selectable,
  selected,
  onSelect,
  onClick,
  disabled,
  className,
  children,
}: MobileDataCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const handleClick = () => {
    if (disabled) return;
    if (selectable && onSelect) {
      onSelect();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'relative bg-card rounded-xl border p-4 transition-all',
        onClick || selectable ? 'cursor-pointer active:scale-[0.98] active:bg-muted/50' : '',
        selected && 'ring-2 ring-primary border-primary',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        {selectable && (
          <button
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5',
              selected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
          >
            {selected && <Check className="w-4 h-4" />}
          </button>
        )}

        {/* Left Icon */}
        {leftIcon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{title}</h3>
            {badge && (
              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                {badge}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}

          {/* Value and Trend */}
          {(value || trend) && (
            <div className="flex items-baseline gap-2 mt-2">
              {value && <span className="text-lg font-semibold">{value}</span>}
              {trend && trendValue && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-medium',
                    trend === 'up' && 'text-green-600',
                    trend === 'down' && 'text-red-600',
                    trend === 'flat' && 'text-muted-foreground'
                  )}
                >
                  <TrendIcon className="w-3 h-3" />
                  {trendValue}
                </span>
              )}
            </div>
          )}

          {/* Status */}
          {status && statusText && (
            <span
              className={cn(
                'inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full',
                statusColors[status]
              )}
            >
              {statusText}
            </span>
          )}

          {/* Children */}
          {children && <div className="mt-3">{children}</div>}
        </div>

        {/* Right Side */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {/* Actions Menu */}
          {actions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={action.destructive ? 'text-destructive' : ''}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Right Icon or Chevron */}
          {rightIcon || (onClick && !actions && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Data Card List ──────────────────────────────────────────────────────
interface MobileDataCardListProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileDataCardList({ children, className }: MobileDataCardListProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}

// ─── Mobile Data Card Skeleton ──────────────────────────────────────────────────
export function MobileDataCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border p-4 animate-pulse', className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
          <div className="h-5 w-1/3 bg-muted rounded mt-2" />
        </div>
        <div className="w-5 h-5 bg-muted rounded" />
      </div>
    </div>
  );
}

export default MobileDataCard;
