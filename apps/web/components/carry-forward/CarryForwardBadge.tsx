'use client';

import { cn } from '@/lib/utils';
import {
  CarryForwardData,
  CF_SOURCE_CONFIG,
  PERFORMANCE_CONFIG,
  ACTION_CONFIG,
} from './types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CarryForwardBadgeProps {
  data: CarryForwardData;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CarryForwardBadge({
  data,
  showDetails = false,
  size = 'md',
  className,
}: CarryForwardBadgeProps) {
  if (!data.isCarryForward) {
    // Show "NEW" badge for new products
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          CF_SOURCE_CONFIG.NEW.bgColor,
          CF_SOURCE_CONFIG.NEW.color,
          size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
          size === 'md' && 'px-2 py-0.5 text-xs',
          size === 'lg' && 'px-3 py-1 text-sm',
          className
        )}
      >
        NEW
      </span>
    );
  }

  const sourceConfig = data.sourceCollection
    ? CF_SOURCE_CONFIG[data.sourceCollection]
    : CF_SOURCE_CONFIG.CORE;

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sourceConfig.bgColor,
        sourceConfig.color,
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-0.5 text-xs',
        size === 'lg' && 'px-3 py-1 text-sm',
        className
      )}
    >
      <RefreshCw className={cn(
        size === 'sm' && 'w-2.5 h-2.5',
        size === 'md' && 'w-3 h-3',
        size === 'lg' && 'w-4 h-4',
      )} />
      CF {data.sourceCollection}
    </span>
  );

  if (!showDetails) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Carry Forward Details</div>

            <div className="grid gap-1.5 text-xs">
              {/* Source Collection */}
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span className="font-medium">{data.sourceCollection}</span>
              </div>

              {/* Original Season */}
              {data.originalSeason && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Season:</span>
                  <span className="font-medium">{data.originalSeason}</span>
                </div>
              )}

              {/* Performance Rating */}
              {data.performanceRating && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Performance:</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                      PERFORMANCE_CONFIG[data.performanceRating].bgColor,
                      PERFORMANCE_CONFIG[data.performanceRating].color
                    )}
                  >
                    {PERFORMANCE_CONFIG[data.performanceRating].label}
                  </span>
                </div>
              )}

              {/* Sell Through Rate */}
              {data.sellThroughRate !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Sell-Through:</span>
                  <span className="font-medium flex items-center gap-1">
                    {(data.sellThroughRate * 100).toFixed(0)}%
                    {data.sellThroughRate >= 0.7 ? (
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    ) : data.sellThroughRate >= 0.4 ? (
                      <Minus className="w-3 h-3 text-amber-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </span>
                </div>
              )}

              {/* Previous Quantity */}
              {data.previousQuantity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Prev. Qty:</span>
                  <span className="font-mono font-medium">
                    {data.previousQuantity.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Recommended Action */}
              {data.recommendedAction && (
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-slate-500">Recommended:</span>
                  <span
                    className={cn(
                      'font-medium flex items-center gap-1',
                      ACTION_CONFIG[data.recommendedAction].color
                    )}
                  >
                    {ACTION_CONFIG[data.recommendedAction].icon}
                    {ACTION_CONFIG[data.recommendedAction].label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CarryForwardBadge;
