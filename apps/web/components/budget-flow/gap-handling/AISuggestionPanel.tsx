'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from '../types';
import { formatCurrency } from '../utils/budget-calculations';
import { useGapCopilot } from '../hooks/useGapCopilot';
import {
  AISuggestion,
  SuggestionAction,
  PRIORITY_COLORS,
} from './types';
import {
  Sparkles,
  ArrowRightLeft,
  TrendingUp,
  Split,
  Merge,
  Clock,
  Star,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface AISuggestionPanelProps {
  budgetId?: string;
  data: BudgetNode;
  onApplySuggestion?: (suggestion: AISuggestion) => Promise<void>;
  onApplyAction?: (action: SuggestionAction) => void;
  className?: string;
}

const SUGGESTION_ICONS: Record<string, React.ReactNode> = {
  reallocate: <ArrowRightLeft className="w-4 h-4" />,
  increase_budget: <TrendingUp className="w-4 h-4" />,
  decrease_budget: <TrendingUp className="w-4 h-4 rotate-180" />,
  split_allocation: <Split className="w-4 h-4" />,
  merge_categories: <Merge className="w-4 h-4" />,
  defer_purchase: <Clock className="w-4 h-4" />,
  prioritize: <Star className="w-4 h-4" />,
};

function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  isApplying,
}: {
  suggestion: AISuggestion;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden transition-all',
        suggestion.priority === 'urgent' && 'border-red-200 dark:border-red-800 shadow-red-100/50 dark:shadow-red-900/30 border-2 border-border',
        suggestion.priority === 'high' && 'border-amber-200 dark:border-amber-800',
        suggestion.priority === 'medium' && 'border-blue-200 dark:border-blue-800',
        suggestion.priority === 'low' && 'border-border'
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'p-2 rounded-lg',
              suggestion.priority === 'urgent' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
              suggestion.priority === 'high' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
              suggestion.priority === 'medium' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              suggestion.priority === 'low' && 'bg-muted dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
            )}
          >
            {SUGGESTION_ICONS[suggestion.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-800 dark:text-neutral-100 truncate">
                {suggestion.title}
              </h4>
              <Badge className={cn('text-xs', PRIORITY_COLORS[suggestion.priority])}>
                {suggestion.priority}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 line-clamp-2">
              {suggestion.description}
            </p>
          </div>
        </div>

        {/* Impact & Confidence */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-sm">
              <span className="font-medium text-slate-800 dark:text-neutral-100">
                {formatCurrency(suggestion.impact.amount)}
              </span>
              <span className="text-slate-500 dark:text-neutral-400"> impact</span>
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-neutral-400">Confidence</span>
              <span className="font-medium dark:text-neutral-200">{suggestion.confidence}%</span>
            </div>
            <Progress value={suggestion.confidence} className="h-1.5" />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            onClick={onApply}
            disabled={isApplying}
            className="flex-1 bg-amber-500 hover:bg-amber-600"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDismiss}
            disabled={isApplying}
          >
            <X className="w-4 h-4" />
          </Button>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Expanded Details */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-neutral-800 pt-3 space-y-3">
            {/* Reasoning */}
            <div>
              <h5 className="text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-semibold mb-1">
                AI Reasoning
              </h5>
              <p className="text-sm text-slate-600 dark:text-neutral-400 bg-muted/50 dark:bg-neutral-900 p-3 rounded-lg">
                {suggestion.reasoning}
              </p>
            </div>

            {/* Actions Detail */}
            <div>
              <h5 className="text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-semibold mb-2">
                Changes to Apply
              </h5>
              <div className="space-y-2">
                {suggestion.actions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 dark:bg-neutral-900 rounded-lg text-sm"
                  >
                    <span className="text-slate-600 dark:text-neutral-400">{action.nodeId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-neutral-500 tabular-nums">
                        {formatCurrency(action.currentValue)}
                      </span>
                      <span className="text-slate-400 dark:text-neutral-500">→</span>
                      <span className="font-medium text-slate-800 dark:text-neutral-100 tabular-nums">
                        {formatCurrency(action.newValue)}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          action.change > 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )}
                      >
                        {action.change > 0 ? '+' : ''}
                        {formatCurrency(action.change)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function AISuggestionPanel({
  budgetId,
  data,
  onApplySuggestion,
  onApplyAction,
  className,
}: AISuggestionPanelProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Use the gap copilot hook for API integration
  const {
    gaps,
    gapSummary,
    isAnalyzing,
    suggestions,
    isGeneratingSuggestions,
    generateSuggestions: generateSuggestionsFromApi,
    applySuggestion: applySuggestionViaApi,
    dismissSuggestion: dismissSuggestionViaApi,
    analyzeGaps: analyzeGapsViaApi,
  } = useGapCopilot({
    budgetId: budgetId || '',
    budgetNode: data,
  });

  // Initial analysis on mount
  useEffect(() => {
    if (budgetId || data) {
      analyzeGapsViaApi();
    }
  }, [budgetId, analyzeGapsViaApi]);

  // Generate suggestions after gaps are analyzed
  useEffect(() => {
    if (gaps.length > 0 && suggestions.length === 0 && !isGeneratingSuggestions) {
      generateSuggestionsFromApi();
    }
  }, [gaps, suggestions.length, isGeneratingSuggestions, generateSuggestionsFromApi]);

  const handleApply = useCallback(async (suggestion: AISuggestion) => {
    setApplyingId(suggestion.id);
    try {
      // Try API first if budgetId is provided
      if (budgetId) {
        const success = await applySuggestionViaApi(suggestion.id);
        if (success) {
          toast.success(`Applied: ${suggestion.title}`);
          setApplyingId(null);
          return;
        }
      }

      // Fallback to local handlers
      if (onApplySuggestion) {
        await onApplySuggestion(suggestion);
      } else if (onApplyAction) {
        suggestion.actions.forEach((action) => {
          onApplyAction(action);
        });
      }
      toast.success(`Applied: ${suggestion.title}`);
    } catch (error) {
      toast.error('Failed to apply suggestion');
    } finally {
      setApplyingId(null);
    }
  }, [budgetId, applySuggestionViaApi, onApplySuggestion, onApplyAction]);

  const handleDismiss = useCallback(async (suggestionId: string) => {
    // Try API first if budgetId is provided
    if (budgetId) {
      await dismissSuggestionViaApi(suggestionId, 'User dismissed');
    }
    toast.info('Suggestion dismissed');
  }, [budgetId, dismissSuggestionViaApi]);

  const handleRegenerateAll = useCallback(async () => {
    await analyzeGapsViaApi();
    await generateSuggestionsFromApi({ maxSuggestions: 10 });
    toast.success('Suggestions refreshed');
  }, [analyzeGapsViaApi, generateSuggestionsFromApi]);

  const isLoading = isAnalyzing || isGeneratingSuggestions;

  if (gaps.length === 0 && !isLoading) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h4 className="font-medium text-slate-800 dark:text-neutral-100 mb-1">All Optimized</h4>
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          No optimization suggestions at this time. Your budget allocation looks good!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-neutral-100">AI Suggestions</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {suggestions.length} recommendations
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerateAll}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Gap Summary */}
      {gapSummary && !isLoading && (
        <div className="p-3 bg-muted/50 dark:bg-neutral-900 rounded-lg">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-semibold text-slate-800 dark:text-neutral-100">{gapSummary.nodesWithGaps}</div>
              <div className="text-slate-500 dark:text-neutral-400">Gaps Found</div>
            </div>
            <div>
              <div className="font-semibold text-red-600 dark:text-red-400">{gapSummary.bySeverity.critical}</div>
              <div className="text-slate-500 dark:text-neutral-400">Critical</div>
            </div>
            <div>
              <div className="font-semibold text-amber-600 dark:text-amber-400">{gapSummary.bySeverity.warning}</div>
              <div className="text-slate-500 dark:text-neutral-400">Warning</div>
            </div>
            <div>
              <div className="font-semibold text-slate-600 dark:text-neutral-300">{gapSummary.avgGapPercent.toFixed(1)}%</div>
              <div className="text-slate-500 dark:text-neutral-400">Avg Gap</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-100 dark:border-amber-800">
          <Loader2 className="w-8 h-8 mx-auto text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {isAnalyzing ? 'Analyzing budget gaps...' : 'Generating AI suggestions...'}
          </p>
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={() => handleApply(suggestion)}
              onDismiss={() => handleDismiss(suggestion.id)}
              isApplying={applyingId === suggestion.id}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && gaps.length > 0 && (
        <div className="p-6 text-center bg-muted/50 dark:bg-neutral-900 rounded-xl">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-400 dark:text-neutral-500 mb-3" />
          <p className="text-sm text-slate-600 dark:text-neutral-400 mb-3">
            All suggestions have been addressed.
          </p>
          <Button variant="outline" size="sm" onClick={handleRegenerateAll}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate New Suggestions
          </Button>
        </div>
      )}
    </div>
  );
}

export default AISuggestionPanel;
