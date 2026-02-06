'use client';

import { BudgetNode } from '../types';

// Gap analysis result
export interface GapAnalysis {
  nodeId: string;
  nodeName: string;
  nodePath: string[];
  budget: number;
  allocated: number;
  gap: number;
  gapPercent: number;
  severity: 'critical' | 'warning' | 'info' | 'ok';
  type: 'over' | 'under' | 'balanced';
  childrenWithGaps: number;
}

// AI Suggestion types
export type SuggestionType =
  | 'reallocate'
  | 'increase_budget'
  | 'decrease_budget'
  | 'split_allocation'
  | 'merge_categories'
  | 'defer_purchase'
  | 'prioritize';

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  impact: {
    amount: number;
    percent: number;
    affectedNodes: string[];
  };
  confidence: number; // 0-100
  priority: 'urgent' | 'high' | 'medium' | 'low';
  actions: SuggestionAction[];
  reasoning: string;
}

export interface SuggestionAction {
  nodeId: string;
  field: 'budget' | 'allocated';
  currentValue: number;
  newValue: number;
  change: number;
}

// Gap resolution
export interface GapResolution {
  suggestionId: string;
  appliedAt: Date;
  changes: SuggestionAction[];
  result: 'success' | 'partial' | 'failed';
}

// Helper functions
export function analyzeGaps(node: BudgetNode, path: string[] = []): GapAnalysis[] {
  const results: GapAnalysis[] = [];
  const currentPath = [...path, node.name];

  // Calculate gap for this node
  const gap = node.budget - node.allocated;
  const gapPercent = node.budget > 0 ? (gap / node.budget) * 100 : 0;

  // Determine severity
  let severity: GapAnalysis['severity'] = 'ok';
  if (Math.abs(gapPercent) > 20) severity = 'critical';
  else if (Math.abs(gapPercent) > 10) severity = 'warning';
  else if (Math.abs(gapPercent) > 5) severity = 'info';

  // Determine type
  let type: GapAnalysis['type'] = 'balanced';
  if (gap > 0) type = 'under';
  else if (gap < 0) type = 'over';

  // Count children with gaps
  let childrenWithGaps = 0;
  if (node.children) {
    node.children.forEach((child) => {
      const childGap = child.budget - child.allocated;
      if (Math.abs(childGap) > 0) childrenWithGaps++;
    });
  }

  // Add this node's analysis
  if (severity !== 'ok' || childrenWithGaps > 0) {
    results.push({
      nodeId: node.id,
      nodeName: node.name,
      nodePath: currentPath,
      budget: node.budget,
      allocated: node.allocated,
      gap,
      gapPercent,
      severity,
      type,
      childrenWithGaps,
    });
  }

  // Recursively analyze children
  if (node.children) {
    node.children.forEach((child) => {
      results.push(...analyzeGaps(child, currentPath));
    });
  }

  return results;
}

export function generateSuggestions(
  gaps: GapAnalysis[],
  rootNode: BudgetNode
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Find over-budget and under-budget nodes
  const overBudget = gaps.filter((g) => g.type === 'over');
  const underBudget = gaps.filter((g) => g.type === 'under');

  // Suggestion 1: Reallocate from under to over
  if (overBudget.length > 0 && underBudget.length > 0) {
    const largestOver = overBudget.sort((a, b) => a.gap - b.gap)[0]; // Most negative
    const largestUnder = underBudget.sort((a, b) => b.gap - a.gap)[0]; // Most positive

    const transferAmount = Math.min(Math.abs(largestOver.gap), largestUnder.gap);

    suggestions.push({
      id: `realloc-${Date.now()}`,
      type: 'reallocate',
      title: `Reallocate from ${largestUnder.nodeName} to ${largestOver.nodeName}`,
      description: `Transfer $${transferAmount.toLocaleString()} from under-allocated ${largestUnder.nodeName} to cover ${largestOver.nodeName} overage.`,
      impact: {
        amount: transferAmount,
        percent: (transferAmount / rootNode.budget) * 100,
        affectedNodes: [largestUnder.nodeId, largestOver.nodeId],
      },
      confidence: 85,
      priority: largestOver.severity === 'critical' ? 'urgent' : 'high',
      actions: [
        {
          nodeId: largestUnder.nodeId,
          field: 'budget',
          currentValue: largestUnder.budget,
          newValue: largestUnder.budget - transferAmount,
          change: -transferAmount,
        },
        {
          nodeId: largestOver.nodeId,
          field: 'budget',
          currentValue: largestOver.budget,
          newValue: largestOver.budget + transferAmount,
          change: transferAmount,
        },
      ],
      reasoning: `${largestUnder.nodeName} has ${largestUnder.gapPercent.toFixed(1)}% unallocated budget while ${largestOver.nodeName} is ${Math.abs(largestOver.gapPercent).toFixed(1)}% over budget. Reallocating funds will balance both categories.`,
    });
  }

  // Suggestion 2: Auto-balance all children
  const criticalGaps = gaps.filter((g) => g.severity === 'critical');
  if (criticalGaps.length > 1) {
    const totalAdjustment = criticalGaps.reduce(
      (sum, g) => sum + Math.abs(g.gap),
      0
    );

    suggestions.push({
      id: `autobalance-${Date.now()}`,
      type: 'split_allocation',
      title: 'Auto-Balance All Categories',
      description: `Automatically redistribute budgets across ${criticalGaps.length} categories to achieve optimal allocation.`,
      impact: {
        amount: totalAdjustment,
        percent: (totalAdjustment / rootNode.budget) * 100,
        affectedNodes: criticalGaps.map((g) => g.nodeId),
      },
      confidence: 75,
      priority: 'high',
      actions: criticalGaps.map((g) => ({
        nodeId: g.nodeId,
        field: 'budget' as const,
        currentValue: g.budget,
        newValue: g.allocated,
        change: g.gap * -1,
      })),
      reasoning: `${criticalGaps.length} categories have significant gaps. Auto-balancing will align budgets with actual allocations, reducing variance.`,
    });
  }

  // Suggestion 3: Prioritize critical over-budget items
  if (overBudget.filter((g) => g.severity === 'critical').length > 0) {
    const criticalOver = overBudget.filter((g) => g.severity === 'critical')[0];

    suggestions.push({
      id: `prioritize-${Date.now()}`,
      type: 'prioritize',
      title: `Prioritize ${criticalOver.nodeName} Budget`,
      description: `Increase budget for ${criticalOver.nodeName} by ${Math.abs(criticalOver.gap).toLocaleString()} to cover current allocation.`,
      impact: {
        amount: Math.abs(criticalOver.gap),
        percent: Math.abs(criticalOver.gapPercent),
        affectedNodes: [criticalOver.nodeId],
      },
      confidence: 90,
      priority: 'urgent',
      actions: [
        {
          nodeId: criticalOver.nodeId,
          field: 'budget',
          currentValue: criticalOver.budget,
          newValue: criticalOver.allocated,
          change: Math.abs(criticalOver.gap),
        },
      ],
      reasoning: `${criticalOver.nodeName} is ${Math.abs(criticalOver.gapPercent).toFixed(1)}% over budget. Increasing the budget will align it with current commitments and prevent overspending alerts.`,
    });
  }

  // Suggestion 4: Defer or reduce under-utilized categories
  const significantUnder = underBudget.filter((g) => g.gapPercent > 15);
  if (significantUnder.length > 0) {
    const largestUnder = significantUnder[0];

    suggestions.push({
      id: `defer-${Date.now()}`,
      type: 'defer_purchase',
      title: `Review ${largestUnder.nodeName} Budget`,
      description: `${largestUnder.nodeName} has $${largestUnder.gap.toLocaleString()} (${largestUnder.gapPercent.toFixed(1)}%) unallocated. Consider reducing or reallocating.`,
      impact: {
        amount: largestUnder.gap,
        percent: largestUnder.gapPercent,
        affectedNodes: [largestUnder.nodeId],
      },
      confidence: 70,
      priority: 'medium',
      actions: [
        {
          nodeId: largestUnder.nodeId,
          field: 'budget',
          currentValue: largestUnder.budget,
          newValue: largestUnder.allocated,
          change: -largestUnder.gap,
        },
      ],
      reasoning: `${largestUnder.nodeName} shows significant under-utilization. This budget could be better used elsewhere or reduced to reflect actual needs.`,
    });
  }

  return suggestions;
}

// Severity color mapping
export const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  ok: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
};

export const PRIORITY_COLORS = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-amber-500 text-white',
  medium: 'bg-blue-500 text-white',
  low: 'bg-slate-400 text-white',
};
