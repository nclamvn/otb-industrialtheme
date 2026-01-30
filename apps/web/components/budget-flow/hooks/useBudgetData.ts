'use client';

import { useState, useEffect, useCallback } from 'react';
import { BudgetNode } from '../types';

interface UseBudgetDataOptions {
  budgetId?: string;
  initialData?: BudgetNode;
}

interface UseBudgetDataReturn {
  data: BudgetNode | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateBudget: (nodeId: string, newBudget: number) => Promise<void>;
}

// Helper function to update budget in nested tree
function updateNodeBudget(node: BudgetNode, nodeId: string, newBudget: number): BudgetNode {
  if (node.id === nodeId) {
    return { ...node, budget: newBudget };
  }

  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updateNodeBudget(child, nodeId, newBudget)),
    };
  }

  return node;
}

// Helper function to recalculate percentages after budget update
function recalculatePercentages(node: BudgetNode, parentBudget?: number): BudgetNode {
  const percentage = parentBudget ? node.budget / parentBudget : 1;

  if (node.children) {
    const totalChildBudget = node.children.reduce((sum, child) => sum + child.budget, 0);
    return {
      ...node,
      percentage,
      children: node.children.map(child => recalculatePercentages(child, totalChildBudget)),
    };
  }

  return { ...node, percentage };
}

export function useBudgetData({ budgetId, initialData }: UseBudgetDataOptions = {}): UseBudgetDataReturn {
  const [data, setData] = useState<BudgetNode | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Fetch budget data from API
  const fetchData = useCallback(async () => {
    if (!budgetId) {
      // If no budgetId, use initial data
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/budgets/${budgetId}`);
      // if (!response.ok) throw new Error('Failed to fetch budget data');
      // const budgetData = await response.json();
      // setData(budgetData);

      // For now, simulate API delay and return initial data
      await new Promise(resolve => setTimeout(resolve, 500));

      if (initialData) {
        setData(initialData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, initialData]);

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Update budget value
  const updateBudget = useCallback(async (nodeId: string, newBudget: number) => {
    if (!data) return;

    // Optimistic update
    const updatedData = updateNodeBudget(data, nodeId, newBudget);
    const recalculatedData = recalculatePercentages(updatedData);
    setData(recalculatedData);

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/budgets/${budgetId}/nodes/${nodeId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ budget: newBudget }),
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log(`Budget updated: ${nodeId} -> ${newBudget}`);
    } catch (err) {
      // Revert on error
      setData(data);
      setError('Failed to update budget');
    }
  }, [data]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    updateBudget,
  };
}

export default useBudgetData;
