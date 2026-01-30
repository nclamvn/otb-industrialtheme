'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  SKUWarning,
  SKUSuggestion,
  formatCurrency,
  WarningSeverity,
} from './types';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

interface AIWarningsPanelProps {
  warnings: SKUWarning[];
  suggestions: SKUSuggestion[];
  isAnalyzing?: boolean;
  onAnalyze?: () => void;
  onDismissSuggestion?: (suggestionId: string) => void;
  onApplySuggestion?: (suggestionId: string) => void;
  className?: string;
}

// Warning severity config
const SEVERITY_CONFIG: Record<
  WarningSeverity,
  { icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string }
> = {
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
};

// Suggestion type icons
const SUGGESTION_ICONS: Record<string, React.ReactNode> = {
  'adjust-sales-mix': <TrendingUp className="w-4 h-4" />,
  'add-size': <Plus className="w-4 h-4" />,
  'remove-size': <Minus className="w-4 h-4" />,
  'increase-qty': <TrendingUp className="w-4 h-4" />,
  'decrease-qty': <TrendingDown className="w-4 h-4" />,
  'historical-insight': <Lightbulb className="w-4 h-4" />,
};

function WarningItem({ warning }: { warning: SKUWarning }) {
  const config = SEVERITY_CONFIG[warning.severity];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className={cn('mt-0.5', config.textColor)}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', config.textColor)}>{warning.message}</p>
      </div>
    </div>
  );
}

function SuggestionItem({
  suggestion,
  onDismiss,
  onApply,
}: {
  suggestion: SKUSuggestion;
  onDismiss: () => void;
  onApply: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const icon = SUGGESTION_ICONS[suggestion.type] || <Lightbulb className="w-4 h-4" />;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 overflow-hidden">
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">{icon}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-slate-800 text-sm">
                {suggestion.title}
              </h4>
              <Badge
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-700"
              >
                {suggestion.confidence}% confident
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{suggestion.description}</p>

            {/* Impact */}
            {suggestion.impact && (
              <div className="flex items-center gap-3 mt-2 text-xs">
                {suggestion.impact.budgetChange !== undefined && (
                  <span
                    className={cn(
                      'tabular-nums',
                      suggestion.impact.budgetChange > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    )}
                  >
                    {suggestion.impact.budgetChange > 0 ? '+' : ''}
                    {formatCurrency(suggestion.impact.budgetChange)} budget
                  </span>
                )}
                {suggestion.impact.qtyChange !== undefined && (
                  <span
                    className={cn(
                      'tabular-nums',
                      suggestion.impact.qtyChange > 0
                        ? 'text-blue-600'
                        : 'text-slate-600'
                    )}
                  >
                    {suggestion.impact.qtyChange > 0 ? '+' : ''}
                    {suggestion.impact.qtyChange} units
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Details (Expandable) */}
        {suggestion.action && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2">
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {isExpanded ? 'Hide details' : 'View details'}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-2 bg-white rounded border border-blue-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current:</span>
                  <span className="font-medium tabular-nums">
                    {suggestion.action.field === 'salesMixPercent'
                      ? `${suggestion.action.currentValue}%`
                      : suggestion.action.currentValue}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-500">Suggested:</span>
                  <span className="font-medium text-blue-600 tabular-nums">
                    {suggestion.action.field === 'salesMixPercent'
                      ? `${suggestion.action.suggestedValue}%`
                      : suggestion.action.suggestedValue}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
            onClick={onApply}
          >
            <Check className="w-3 h-3 mr-1" />
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-500"
            onClick={onDismiss}
          >
            <X className="w-3 h-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AIWarningsPanel({
  warnings,
  suggestions,
  isAnalyzing = false,
  onAnalyze,
  onDismissSuggestion,
  onApplySuggestion,
  className,
}: AIWarningsPanelProps) {
  const [warningsExpanded, setWarningsExpanded] = useState(true);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);

  // Group warnings by severity
  const errorWarnings = warnings.filter((w) => w.severity === 'error');
  const warningWarnings = warnings.filter((w) => w.severity === 'warning');
  const infoWarnings = warnings.filter((w) => w.severity === 'info');

  // Handle dismiss
  const handleDismiss = useCallback(
    (suggestionId: string) => {
      if (onDismissSuggestion) {
        onDismissSuggestion(suggestionId);
      }
    },
    [onDismissSuggestion]
  );

  // Handle apply
  const handleApply = useCallback(
    (suggestionId: string) => {
      if (onApplySuggestion) {
        onApplySuggestion(suggestionId);
      }
    },
    [onApplySuggestion]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">AI Assistant</h3>
              <p className="text-xs text-slate-500">Warnings & suggestions</p>
            </div>
          </div>

          {onAnalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Analyze
            </Button>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2">
          {errorWarnings.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {errorWarnings.length} Errors
            </Badge>
          )}
          {warningWarnings.length > 0 && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <AlertTriangle className="w-3 h-3" />
              {warningWarnings.length} Warnings
            </Badge>
          )}
          {suggestions.length > 0 && (
            <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
              <Lightbulb className="w-3 h-3" />
              {suggestions.length} Suggestions
            </Badge>
          )}
          {warnings.length === 0 && suggestions.length === 0 && (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
              <Check className="w-3 h-3" />
              All Good
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Loading State */}
          {isAnalyzing && (
            <div className="p-6 text-center">
              <Loader2 className="w-8 h-8 mx-auto text-purple-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Analyzing proposal...</p>
            </div>
          )}

          {/* Warnings Section */}
          {warnings.length > 0 && !isAnalyzing && (
            <Collapsible open={warningsExpanded} onOpenChange={setWarningsExpanded}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-2 hover:bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-sm text-slate-700">
                      Warnings ({warnings.length})
                    </span>
                  </div>
                  {warningsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2">
                  {/* Errors first */}
                  {errorWarnings.map((warning) => (
                    <WarningItem key={warning.id} warning={warning} />
                  ))}
                  {/* Then warnings */}
                  {warningWarnings.map((warning) => (
                    <WarningItem key={warning.id} warning={warning} />
                  ))}
                  {/* Then info */}
                  {infoWarnings.map((warning) => (
                    <WarningItem key={warning.id} warning={warning} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Separator */}
          {warnings.length > 0 && suggestions.length > 0 && <Separator />}

          {/* Suggestions Section */}
          {suggestions.length > 0 && !isAnalyzing && (
            <Collapsible
              open={suggestionsExpanded}
              onOpenChange={setSuggestionsExpanded}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-2 hover:bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm text-slate-700">
                      Suggestions ({suggestions.length})
                    </span>
                  </div>
                  {suggestionsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 mt-2">
                  {suggestions.map((suggestion) => (
                    <SuggestionItem
                      key={suggestion.id}
                      suggestion={suggestion}
                      onDismiss={() => handleDismiss(suggestion.id)}
                      onApply={() => handleApply(suggestion.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Empty State */}
          {warnings.length === 0 && suggestions.length === 0 && !isAnalyzing && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-slate-800 mb-1">Looking Good!</h4>
              <p className="text-sm text-slate-500">
                No issues found in your proposal
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default AIWarningsPanel;
