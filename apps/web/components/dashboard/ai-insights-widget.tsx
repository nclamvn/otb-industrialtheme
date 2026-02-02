'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { BudgetStatusBadge } from '@/components/ui/budget';

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'forecast';
  title: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
  metric?: {
    label: string;
    value: string;
    change?: number;
  };
  actionUrl?: string;
}

interface AIInsightsWidgetProps {
  insights: AIInsight[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const typeIcons = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  recommendation: Lightbulb,
  forecast: TrendingDown,
};

const typeColors = {
  trend: 'text-blue-600 bg-blue-50',
  anomaly: 'text-red-600 bg-red-50',
  recommendation: 'text-purple-600 bg-purple-50',
  forecast: 'text-green-600 bg-green-50',
};

// Map insight type to unified border colors
const typeBorderColors = {
  trend: 'border-l-blue-500',
  anomaly: 'border-l-red-500',
  recommendation: 'border-l-purple-500',
  forecast: 'border-l-green-500',
};

const impactBadgeVariants = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

export function AIInsightsWidget({
  insights,
  isLoading,
  onRefresh,
}: AIInsightsWidgetProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <div
      className={cn(
        // Flat design: rounded-xl, no shadow, border-l-4
        'relative rounded-xl border border-border bg-card overflow-hidden',
        'hover:border-border/80 transition-all duration-200',
        'border-l-4 border-l-purple-500'
      )}
    >
      {/* Watermark Icon */}
      <div className="absolute -right-4 -bottom-4 pointer-events-none">
        <Sparkles className="w-24 h-24 text-purple-500 opacity-[0.08]" />
      </div>

      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t('aiInsights')}</h3>
            <p className="text-xs text-slate-500">{t('poweredByAI')}</p>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {tCommon('refresh')}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-4">
              {insights.map((insight) => {
                const Icon = typeIcons[insight.type];
                const colorClass = typeColors[insight.type];
                const borderColorClass = typeBorderColors[insight.type];

                return (
                  <div
                    key={insight.id}
                    className={cn(
                      // Flat design: rounded-xl, border-l-4, no shadow
                      'p-3 rounded-xl border border-border bg-card',
                      'border-l-4 hover:border-border/80 transition-all duration-200',
                      borderColorClass,
                      insight.actionUrl && 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (insight.actionUrl) {
                        window.location.href = insight.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{insight.title}</p>
                          {insight.impact && (
                            <Badge variant={impactBadgeVariants[insight.impact]} className="shrink-0 text-xs">
                              {insight.impact}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-2">
                          {insight.description}
                        </p>
                        {insight.metric && (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-xs text-slate-500">
                              {insight.metric.label}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums flex items-center gap-1">
                              {insight.metric.value}
                              {insight.metric.change !== undefined && (
                                <span
                                  className={cn(
                                    'text-xs',
                                    insight.metric.change > 0
                                      ? 'text-green-600'
                                      : insight.metric.change < 0
                                      ? 'text-red-600'
                                      : 'text-slate-400'
                                  )}
                                >
                                  ({insight.metric.change > 0 ? '+' : ''}
                                  {insight.metric.change}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {insight.actionUrl && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                            <span>{t('viewDetails')}</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {insights.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('noInsights')}</p>
                  <p className="text-xs">{t('checkBackLater')}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
