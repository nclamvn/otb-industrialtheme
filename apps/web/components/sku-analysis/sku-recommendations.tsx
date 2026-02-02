'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Tag,
  Trash2,
  ArrowRightLeft,
  Megaphone,
  ArrowRight,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBudgetCurrency } from '@/components/ui/budget';

export interface SKURecommendation {
  skuId: string;
  skuCode: string;
  skuName: string;
  action: 'REORDER' | 'MARKDOWN' | 'DISCONTINUE' | 'TRANSFER' | 'PROMOTE';
  reason: string;
  suggestedQuantity?: number;
  suggestedMarkdownPct?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  potentialImpact: number;
}

interface SKURecommendationsProps {
  recommendations: SKURecommendation[];
  onActionClick?: (recommendation: SKURecommendation) => void;
}

// Unified action config with icon containers
const ACTION_CONFIG: Record<
  SKURecommendation['action'],
  { icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string; label: string }
> = {
  REORDER: { icon: <ShoppingCart className="h-4 w-4" />, bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-l-blue-500', label: 'Reorder' },
  MARKDOWN: { icon: <Tag className="h-4 w-4" />, bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-l-amber-500', label: 'Markdown' },
  DISCONTINUE: { icon: <Trash2 className="h-4 w-4" />, bgColor: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-l-red-500', label: 'Discontinue' },
  TRANSFER: { icon: <ArrowRightLeft className="h-4 w-4" />, bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-l-purple-500', label: 'Transfer' },
  PROMOTE: { icon: <Megaphone className="h-4 w-4" />, bgColor: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-l-green-500', label: 'Promote' },
};

// Unified priority config
const PRIORITY_CONFIG: Record<SKURecommendation['priority'], { color: string; borderColor: string; label: string }> = {
  HIGH: { color: 'bg-red-50 text-red-700 border-red-200', borderColor: 'border-l-red-500', label: 'High Priority' },
  MEDIUM: { color: 'bg-amber-50 text-amber-700 border-amber-200', borderColor: 'border-l-amber-500', label: 'Medium Priority' },
  LOW: { color: 'bg-green-50 text-green-700 border-green-200', borderColor: 'border-l-green-500', label: 'Low Priority' },
};

export function SKURecommendations({ recommendations, onActionClick }: SKURecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <div
        className={cn(
          // Unified: rounded-xl, border border-border, border-l-4
          'relative rounded-xl border border-border bg-card overflow-hidden',
          'border border-border border-l-4 border-l-slate-400'
        )}
      >
        {/* Watermark Icon */}
        <div className="absolute -right-4 -bottom-4 pointer-events-none">
          <Package className="w-24 h-24 text-slate-500 opacity-[0.08]" />
        </div>
        <div className="p-6 text-center text-slate-400">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recommendations available at this time.</p>
        </div>
      </div>
    );
  }

  // Group by priority
  const groupedByPriority = recommendations.reduce(
    (acc, rec) => {
      acc[rec.priority].push(rec);
      return acc;
    },
    { HIGH: [], MEDIUM: [], LOW: [] } as Record<string, SKURecommendation[]>,
  );

  return (
    <div className="space-y-6">
      {(['HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => {
        const items = groupedByPriority[priority];
        if (items.length === 0) return null;
        const priorityConfig = PRIORITY_CONFIG[priority];

        return (
          <div
            key={priority}
            className={cn(
              // Unified: rounded-xl, border border-border, hover:border-border/80, border-l-4
              'rounded-xl border border-border bg-card overflow-hidden',
              'hover:border-border/80 transition-all duration-200',
              'border-l-4',
              priorityConfig.borderColor
            )}
          >
            {/* Header */}
            <div className="p-4 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('border', priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                  <span className="text-slate-500 font-normal text-sm">
                    ({items.length} recommendation{items.length > 1 ? 's' : ''})
                  </span>
                </div>
                <span className="text-sm text-slate-500">
                  Potential Impact: <span className="font-semibold text-slate-900 tabular-nums">{formatBudgetCurrency(items.reduce((sum, r) => sum + r.potentialImpact, 0))}</span>
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="space-y-3">
                {items.map((rec) => {
                  const actionConfig = ACTION_CONFIG[rec.action];
                  return (
                    <div
                      key={rec.skuId}
                      className={cn(
                        // Unified: rounded-xl, border-l-4, border border-border, hover:border-border/80
                        'flex items-center gap-4 p-3 rounded-xl border border-border bg-card',
                        'border-l-4 hover:border-border/80 transition-all duration-200',
                        actionConfig.borderColor
                      )}
                    >
                      {/* Unified: w-10 h-10 rounded-xl icon container */}
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                          actionConfig.bgColor,
                          actionConfig.textColor,
                        )}
                      >
                        {actionConfig.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{rec.skuCode}</span>
                          <Badge variant="outline" className="border-slate-200">{actionConfig.label}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{rec.skuName}</p>
                        <p className="text-xs text-slate-400 mt-1">{rec.reason}</p>
                      </div>

                      <div className="text-right">
                        {rec.suggestedQuantity && (
                          <p className="text-sm">
                            <span className="text-slate-500">Qty:</span>{' '}
                            <span className="font-medium text-slate-900 tabular-nums">{rec.suggestedQuantity}</span>
                          </p>
                        )}
                        {rec.suggestedMarkdownPct && (
                          <p className="text-sm">
                            <span className="text-slate-500">MD:</span>{' '}
                            <span className="font-medium text-amber-600 tabular-nums">
                              {rec.suggestedMarkdownPct.toFixed(0)}%
                            </span>
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1 tabular-nums">
                          Impact: {formatBudgetCurrency(rec.potentialImpact)}
                        </p>
                      </div>

                      {onActionClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onActionClick(rec)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
