'use client';

import { useState, useCallback } from 'react';
import { budgetsApi } from '@/lib/api-client';
import { BudgetNode } from '../types';
import { GapAnalysis, AISuggestion, analyzeGaps, generateSuggestions } from '../gap-handling/types';

interface UseGapCopilotOptions {
  budgetId: string;
  budgetNode?: BudgetNode;
}

interface UseGapCopilotReturn {
  // Gap Analysis
  gaps: GapAnalysis[];
  gapSummary: GapSummary | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  analyzeGaps: (options?: AnalyzeGapsOptions) => Promise<void>;

  // AI Suggestions
  suggestions: AISuggestion[];
  isGeneratingSuggestions: boolean;
  suggestionsError: string | null;
  generateSuggestions: (options?: GenerateSuggestionsOptions) => Promise<void>;
  applySuggestion: (suggestionId: string, options?: ApplySuggestionOptions) => Promise<boolean>;
  dismissSuggestion: (suggestionId: string, reason: string) => Promise<boolean>;

  // Actions
  refreshAll: () => Promise<void>;
}

interface GapSummary {
  totalNodes: number;
  nodesWithGaps: number;
  totalBudget: number;
  totalAllocated: number;
  totalGap: number;
  avgGapPercent: number;
  bySeverity: {
    ok: number;
    info: number;
    warning: number;
    critical: number;
  };
  byType: {
    balanced: number;
    under: number;
    over: number;
  };
}

interface AnalyzeGapsOptions {
  minGapPercent?: number;
  levels?: number[];
  includeChildren?: boolean;
}

interface GenerateSuggestionsOptions {
  maxSuggestions?: number;
  minConfidence?: number;
  focusNodeIds?: string[];
  types?: string[];
}

interface ApplySuggestionOptions {
  applyToNodeIds?: string[];
  comment?: string;
}

export function useGapCopilot({ budgetId, budgetNode }: UseGapCopilotOptions): UseGapCopilotReturn {
  // Gap Analysis State
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [gapSummary, setGapSummary] = useState<GapSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Run gap analysis
  const runGapAnalysis = useCallback(async (options: AnalyzeGapsOptions = {}) => {
    if (!budgetId) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Try API first
      const response = await budgetsApi.analyzeGaps(budgetId, options);

      if (response.success && response.data) {
        const data = response.data;

        // Map API response to frontend format
        const mappedGaps: GapAnalysis[] = (data.results || []).map((result: any) => ({
          nodeId: result.nodeId,
          nodeName: result.nodeName,
          nodePath: result.nodePath || [],
          budget: result.budgetValue,
          allocated: result.allocatedValue,
          gap: result.gap,
          gapPercent: result.gapPercent,
          severity: mapSeverity(result.severity),
          type: mapGapType(result.type),
          childrenWithGaps: result.childrenWithGaps || 0,
        }));

        setGaps(mappedGaps);
        setGapSummary({
          totalNodes: data.totalNodes,
          nodesWithGaps: data.nodesWithGaps,
          totalBudget: data.totalBudget,
          totalAllocated: data.totalAllocated,
          totalGap: data.totalGap,
          avgGapPercent: data.avgGapPercent,
          bySeverity: {
            ok: data.bySeverity?.ok ?? 0,
            info: data.bySeverity?.info ?? 0,
            warning: data.bySeverity?.warning ?? 0,
            critical: data.bySeverity?.critical ?? 0,
          },
          byType: {
            balanced: data.byType?.balanced ?? 0,
            under: data.byType?.under ?? 0,
            over: data.byType?.over ?? 0,
          },
        });
      } else if (budgetNode) {
        // Fallback to local analysis if API fails
        const localGaps = analyzeGaps(budgetNode);
        setGaps(localGaps);
        setGapSummary(calculateLocalSummary(localGaps, budgetNode));
      }
    } catch (err) {
      // Fallback to local analysis
      if (budgetNode) {
        const localGaps = analyzeGaps(budgetNode);
        setGaps(localGaps);
        setGapSummary(calculateLocalSummary(localGaps, budgetNode));
      } else {
        setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze gaps');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [budgetId, budgetNode]);

  // Generate AI suggestions
  const generateAISuggestions = useCallback(async (options: GenerateSuggestionsOptions = {}) => {
    if (!budgetId) return;

    setIsGeneratingSuggestions(true);
    setSuggestionsError(null);

    try {
      // Try API first
      const response = await budgetsApi.generateSuggestions(budgetId, options);

      if (response.success && response.data) {
        const mappedSuggestions: AISuggestion[] = (response.data as any[]).map((s: any) => ({
          id: s.id,
          type: mapSuggestionType(s.type),
          title: s.title,
          description: s.description,
          impact: {
            amount: s.impactAmount,
            percent: s.impactPercent,
            affectedNodes: (s.affectedNodes || []).map((n: any) => n.nodeId),
          },
          confidence: s.confidence,
          priority: mapPriority(s.priority),
          actions: (s.actions || []).map((a: any) => ({
            nodeId: a.nodeId,
            field: a.field === 'budgetValue' ? 'budget' : a.field,
            currentValue: a.currentValue,
            newValue: a.newValue,
            change: a.change || (a.newValue - a.currentValue),
          })),
          reasoning: s.reasoning || '',
        }));

        setSuggestions(mappedSuggestions);
      } else if (budgetNode && gaps.length > 0) {
        // Fallback to local generation
        const localSuggestions = generateSuggestions(gaps, budgetNode);
        setSuggestions(localSuggestions);
      }
    } catch (err) {
      // Fallback to local generation
      if (budgetNode && gaps.length > 0) {
        const localSuggestions = generateSuggestions(gaps, budgetNode);
        setSuggestions(localSuggestions);
      } else {
        setSuggestionsError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      }
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [budgetId, budgetNode, gaps]);

  // Apply a suggestion
  const applySuggestion = useCallback(async (
    suggestionId: string,
    options: ApplySuggestionOptions = {}
  ): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      const response = await budgetsApi.applySuggestion(budgetId, suggestionId, options);

      if (response.success) {
        // Remove applied suggestion from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to apply suggestion:', err);
      return false;
    }
  }, [budgetId]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback(async (
    suggestionId: string,
    reason: string
  ): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      const response = await budgetsApi.dismissSuggestion(budgetId, suggestionId, reason);

      if (response.success) {
        // Remove dismissed suggestion from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err);
      // Remove locally anyway for better UX
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      return true;
    }
  }, [budgetId]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await runGapAnalysis();
    await generateAISuggestions();
  }, [runGapAnalysis, generateAISuggestions]);

  return {
    // Gap Analysis
    gaps,
    gapSummary,
    isAnalyzing,
    analysisError,
    analyzeGaps: runGapAnalysis,

    // AI Suggestions
    suggestions,
    isGeneratingSuggestions,
    suggestionsError,
    generateSuggestions: generateAISuggestions,
    applySuggestion,
    dismissSuggestion,

    // Actions
    refreshAll,
  };
}

// Helper functions for mapping API types to frontend types
function mapSeverity(severity: string): GapAnalysis['severity'] {
  const map: Record<string, GapAnalysis['severity']> = {
    OK: 'ok',
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical',
  };
  return map[severity] || 'ok';
}

function mapGapType(type: string): GapAnalysis['type'] {
  const map: Record<string, GapAnalysis['type']> = {
    BALANCED: 'balanced',
    UNDER: 'under',
    OVER: 'over',
  };
  return map[type] || 'balanced';
}

function mapSuggestionType(type: string): AISuggestion['type'] {
  const map: Record<string, AISuggestion['type']> = {
    REALLOCATE: 'reallocate',
    AUTO_BALANCE: 'split_allocation',
    INCREASE_BUDGET: 'increase_budget',
    DECREASE_BUDGET: 'decrease_budget',
    SPLIT_ALLOCATION: 'split_allocation',
    MERGE_ALLOCATION: 'merge_categories',
    PRIORITIZE: 'prioritize',
    DEFER: 'defer_purchase',
  };
  return map[type] || 'reallocate';
}

function mapPriority(priority: string): AISuggestion['priority'] {
  const map: Record<string, AISuggestion['priority']> = {
    URGENT: 'urgent',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  };
  return map[priority] || 'medium';
}

function calculateLocalSummary(gaps: GapAnalysis[], root: BudgetNode): GapSummary {
  const bySeverity = {
    ok: gaps.filter(g => g.severity === 'ok').length,
    info: gaps.filter(g => g.severity === 'info').length,
    warning: gaps.filter(g => g.severity === 'warning').length,
    critical: gaps.filter(g => g.severity === 'critical').length,
  };

  const byType = {
    balanced: gaps.filter(g => g.type === 'balanced').length,
    under: gaps.filter(g => g.type === 'under').length,
    over: gaps.filter(g => g.type === 'over').length,
  };

  const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);
  const avgGapPercent = gaps.length > 0
    ? gaps.reduce((sum, g) => sum + Math.abs(g.gapPercent), 0) / gaps.length
    : 0;

  return {
    totalNodes: gaps.length,
    nodesWithGaps: gaps.filter(g => g.severity !== 'ok').length,
    totalBudget: root.budget,
    totalAllocated: root.allocated,
    totalGap,
    avgGapPercent,
    bySeverity,
    byType,
  };
}

export default useGapCopilot;
