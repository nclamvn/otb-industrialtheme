'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
type InsightType = 'opportunity' | 'risk' | 'recommendation' | 'goal';

interface AIInsightCardProps {
  type: InsightType;
  title: string;
  summary: string;
  details?: string;
  confidence: number; // 0-100
  actionLabel?: string;
  onAction?: () => void;
  onFeedback?: (positive: boolean) => void;
  className?: string;
}

// Type configuration
const TYPE_CONFIG: Record<
  InsightType,
  {
    icon: typeof Sparkles;
    color: string;
    bg: string;
    border: string;
  }
> = {
  opportunity: {
    icon: TrendingUp,
    color: 'text-[#127749]',
    bg: 'bg-[#127749]/10',
    border: 'border-l-[#127749]',
  },
  risk: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-l-amber-500',
  },
  recommendation: {
    icon: Lightbulb,
    color: 'text-[#B8860B]',
    bg: 'bg-[#B8860B]/10',
    border: 'border-l-[#B8860B]',
  },
  goal: {
    icon: Target,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-l-blue-500',
  },
};

export function AIInsightCard({
  type,
  title,
  summary,
  details,
  confidence,
  actionLabel,
  onAction,
  onFeedback,
  className,
}: AIInsightCardProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);

  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const handleFeedback = (positive: boolean) => {
    setFeedbackGiven(positive);
    onFeedback?.(positive);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background overflow-hidden',
        'border-l-[3px]',
        config.border,
        className
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              config.bg
            )}
          >
            <Icon className={cn('w-4 h-4', config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3 h-3" style={{ color: '#B8860B' }} />
              <span
                className="text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: '#B8860B' }}
              >
                AI Insight
              </span>
              <span className="text-[9px] text-muted-foreground ml-auto">
                {confidence}% độ tin cậy
              </span>
            </div>
            <h4 className="text-sm font-semibold">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{summary}</p>

            {details && expanded && (
              <p className="text-xs text-muted-foreground/80 mt-2 p-2 bg-muted rounded">
                {details}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {details && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Feedback */}
            {onFeedback && feedbackGiven === null && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleFeedback(true)}
                  className="w-6 h-6 rounded hover:bg-[#127749]/10 flex items-center justify-center transition-colors"
                >
                  <ThumbsUp className="w-3 h-3 text-muted-foreground hover:text-[#127749]" />
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="w-6 h-6 rounded hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <ThumbsDown className="w-3 h-3 text-muted-foreground hover:text-red-600" />
                </button>
              </div>
            )}
            {feedbackGiven !== null && (
              <span className="text-[10px] text-muted-foreground">
                Cảm ơn phản hồi!
              </span>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAction}
                className="h-7 px-3 text-[10px] gap-1"
              >
                {actionLabel}
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preset variants for common use cases
export function OpportunityInsight(
  props: Omit<AIInsightCardProps, 'type'>
) {
  return <AIInsightCard type="opportunity" {...props} />;
}

export function RiskInsight(props: Omit<AIInsightCardProps, 'type'>) {
  return <AIInsightCard type="risk" {...props} />;
}

export function RecommendationInsight(
  props: Omit<AIInsightCardProps, 'type'>
) {
  return <AIInsightCard type="recommendation" {...props} />;
}

export function GoalInsight(props: Omit<AIInsightCardProps, 'type'>) {
  return <AIInsightCard type="goal" {...props} />;
}
