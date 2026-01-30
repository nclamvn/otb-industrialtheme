'use client';

import { cn } from '@/lib/utils';
import { ThemeGroup, THEME_CONFIG } from './types';
import { Package, TrendingUp, Target, ChevronRight } from 'lucide-react';

interface ThemeGroupCardProps {
  theme: ThemeGroup;
  isSelected?: boolean;
  onClick?: (theme: ThemeGroup) => void;
  showProgress?: boolean;
  className?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `₫${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `₫${(value / 1000000).toFixed(1)}M`;
  }
  return `₫${value.toLocaleString()}`;
};

export function ThemeGroupCard({
  theme,
  isSelected = false,
  onClick,
  showProgress = true,
  className,
}: ThemeGroupCardProps) {
  const config = THEME_CONFIG[theme.type];
  const progress = theme.targetPercentage && theme.currentPercentage
    ? (theme.currentPercentage / theme.targetPercentage) * 100
    : 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-white dark:bg-slate-800 overflow-hidden transition-all duration-200',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={() => onClick?.(theme)}
    >
      {/* Header */}
      <div
        className={cn(
          'px-4 py-3 border-b border-slate-100 dark:border-slate-700',
          config.bgColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('text-lg', config.color)}>{config.icon}</span>
            <div>
              <h4 className={cn('font-semibold', config.color)}>{theme.name}</h4>
              <p className="text-xs text-slate-500">{config.label}</p>
            </div>
          </div>
          {onClick && (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Description */}
        {theme.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {theme.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Product Count */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
              <Package className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {theme.productCount}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Products
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(theme.totalValue)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Value
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && theme.targetPercentage !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Target: {(theme.targetPercentage * 100).toFixed(0)}%
              </span>
              <span className={cn(
                'font-medium',
                progress >= 100 ? 'text-emerald-600' : progress >= 80 ? 'text-blue-600' : 'text-amber-600'
              )}>
                {theme.currentPercentage !== undefined
                  ? `${(theme.currentPercentage * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  progress >= 100
                    ? 'bg-emerald-500'
                    : progress >= 80
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Color Palette */}
        {theme.colorPalette && theme.colorPalette.length > 0 && (
          <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide mr-2">
              Colors:
            </span>
            {theme.colorPalette.slice(0, 6).map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {theme.colorPalette.length > 6 && (
              <span className="text-xs text-slate-400 ml-1">
                +{theme.colorPalette.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Season Tag */}
        <div className="flex justify-end">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
            {theme.season}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ThemeGroupCard;
