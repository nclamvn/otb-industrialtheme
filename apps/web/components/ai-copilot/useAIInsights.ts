'use client';

import { useState, useCallback, useEffect } from 'react';

export interface AIInsight {
  type: 'anomaly' | 'risk' | 'opportunity' | 'info';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  category?: string;
}

export interface UseAIInsightsOptions {
  planId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

export function useAIInsights(options: UseAIInsightsOptions) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = useCallback(async (type: 'quick' | 'full' = 'quick') => {
    if (!options.planId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ai-copilot/insights/${options.planId}?type=${type}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setInsights(data.insights);
      setLastUpdated(new Date(data.generatedAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setIsLoading(false);
    }
  }, [options.planId]);

  const refreshInsights = useCallback(async () => {
    if (!options.planId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-copilot/insights/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otbPlanId: options.planId, type: 'full' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setInsights(data.insights);
      setLastUpdated(new Date(data.generatedAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh insights');
    } finally {
      setIsLoading(false);
    }
  }, [options.planId]);

  // Initial fetch
  useEffect(() => {
    fetchInsights('quick');
  }, [fetchInsights]);

  // Auto refresh
  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) return;

    const interval = setInterval(() => {
      fetchInsights('quick');
    }, options.refreshInterval);

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, fetchInsights]);

  // Computed values
  const highPriorityCount = insights.filter(i => i.severity === 'high').length;
  const hasHighPriority = highPriorityCount > 0;

  return {
    insights,
    isLoading,
    error,
    lastUpdated,
    fetchInsights,
    refreshInsights,
    highPriorityCount,
    hasHighPriority,
  };
}

export default useAIInsights;
