'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  VarianceResult,
  getVarianceColors,
  getVarianceLabel,
  calculateVariance,
  formatCurrency,
  formatPercentage,
  VarianceThresholds,
  DEFAULT_THRESHOLDS,
} from '@/lib/variance-utils';

interface VarianceBreakdown {
  label: string;
  actual: number;
  target: number;
  weight?: number;
}

interface VarianceTooltipProps {
  children: React.ReactNode;
  // Variance data
  variance?: VarianceResult;
  actual?: number;
  target?: number;
  thresholds?: VarianceThresholds;
  positiveIsGood?: boolean;
  // Additional info
  title?: string;
  description?: string;
  breakdown?: VarianceBreakdown[];
  showHistory?: boolean;
  historyData?: { period: string; variance: number }[];
  // Display options
  variant?: 'tooltip' | 'hovercard';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  formatType?: 'currency' | 'percentage' | 'number';
}

export function VarianceTooltip({
  children,
  variance: providedVariance,
  actual,
  target,
  thresholds = DEFAULT_THRESHOLDS,
  positiveIsGood = true,
  title,
  description,
  breakdown,
  showHistory = false,
  historyData,
  variant = 'tooltip',
  side = 'top',
  align = 'center',
  formatType = 'currency',
}: VarianceTooltipProps) {
  const variance = providedVariance ??
    (actual !== undefined && target !== undefined
      ? calculateVariance(actual, target, thresholds, positiveIsGood)
      : null);

  if (!variance) {
    return <>{children}</>;
  }

  const colors = getVarianceColors(variance.level);
  const label = getVarianceLabel(variance.level);

  const formatValue = (value: number) => {
    switch (formatType) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value.toLocaleString();
    }
  };

  const TooltipContentComponent = () => (
    <div className="space-y-3 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={cn('p-1 rounded', colors.bg)}>
          {variance.level === 'positive' || variance.direction === 'over' ? (
            <TrendingUp className={cn('w-4 h-4', colors.icon)} />
          ) : variance.direction === 'under' ? (
            <TrendingDown className={cn('w-4 h-4', colors.icon)} />
          ) : (
            <CheckCircle2 className={cn('w-4 h-4', colors.icon)} />
          )}
        </div>
        <div>
          <p className={cn('font-semibold text-sm', colors.text)}>{label}</p>
          {title && <p className="text-xs text-muted-foreground">{title}</p>}
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Main variance info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 p-2 rounded bg-muted/50">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Target</p>
            <p className="font-mono font-medium">{target !== undefined ? formatValue(target) : 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded bg-muted/50">
          <Calculator className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Actual</p>
            <p className="font-mono font-medium">{actual !== undefined ? formatValue(actual) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Variance stats */}
      <div className={cn('p-2 rounded border', colors.bg, colors.border)}>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Variance</span>
          <div className="text-right">
            <span className={cn('font-mono font-bold', colors.text)}>
              {variance.formattedPercentage}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              ({variance.formattedAbsolute})
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown (if provided) */}
      {breakdown && breakdown.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium flex items-center gap-1">
            <Info className="w-3 h-3" />
            Breakdown
          </p>
          <div className="space-y-1">
            {breakdown.map((item, idx) => {
              const itemVariance = calculateVariance(
                item.actual,
                item.target,
                thresholds,
                positiveIsGood
              );
              const itemColors = getVarianceColors(itemVariance.level);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn('font-mono', itemColors.text)}>
                    {itemVariance.formattedPercentage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History mini chart (if provided) */}
      {showHistory && historyData && historyData.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Variance Trend</p>
          <div className="flex items-end justify-between h-8 gap-0.5">
            {historyData.map((item, idx) => {
              const height = Math.min(Math.abs(item.variance) * 2, 100);
              const isPositive = item.variance > 0;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center"
                  title={`${item.period}: ${item.variance > 0 ? '+' : ''}${item.variance.toFixed(1)}%`}
                >
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      isPositive ? 'bg-green-500' : 'bg-red-500'
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            {historyData.slice(0, 1).map((item) => (
              <span key="first">{item.period}</span>
            ))}
            {historyData.length > 1 && (
              <span>{historyData[historyData.length - 1].period}</span>
            )}
          </div>
        </div>
      )}

      {/* Threshold info */}
      <div className="pt-2 border-t text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          <span>
            Thresholds: Critical ≥{thresholds.critical}%, Warning ≥{thresholds.warning}%
          </span>
        </div>
      </div>
    </div>
  );

  if (variant === 'hovercard') {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>{children}</HoverCardTrigger>
        <HoverCardContent side={side} align={align} className="w-auto p-4">
          <TooltipContentComponent />
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className="p-3 max-w-xs">
          <TooltipContentComponent />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
