'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, RefreshCw, AlertTriangle, TrendingUp, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIInsights, AIInsight } from './useAIInsights';

interface AIInsightsPanelProps {
  planId: string;
  onClose?: () => void;
  className?: string;
}

const insightIcons = {
  anomaly: AlertTriangle,
  risk: AlertTriangle,
  opportunity: TrendingUp,
  info: Info,
};

const severityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function AIInsightsPanel({ planId, onClose, className }: AIInsightsPanelProps) {
  const {
    insights,
    isLoading,
    error,
    lastUpdated,
    refreshInsights,
  } = useAIInsights({ planId });

  const InsightCard = ({ insight }: { insight: AIInsight }) => {
    const Icon = insightIcons[insight.type] || Info;

    return (
      <div
        className={cn(
          'p-3 rounded-lg border',
          severityColors[insight.severity]
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{insight.title}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {insight.type}
              </Badge>
            </div>
            <p className="text-sm opacity-90">{insight.description}</p>
            {insight.action && (
              <p className="text-xs mt-2 font-medium">
                {insight.action}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Insights
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refreshInsights()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {insights.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-6">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No insights available</p>
          </div>
        )}

        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}

        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightsPanel;
