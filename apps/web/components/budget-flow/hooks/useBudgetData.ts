'use client';

import { useState, useEffect, useCallback } from 'react';
import { budgetsApi } from '@/lib/api-client';
import { BudgetNode, HierarchyLevel, CardStatus } from '../types';

interface UseBudgetDataOptions {
  budgetId?: string;
  initialData?: BudgetNode;
}

interface UseBudgetDataReturn {
  data: BudgetNode | null;
  budget: any | null; // Budget metadata from API
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateBudget: (nodeId: string, newBudget: number) => Promise<void>;
  updateNode: (nodeId: string, data: Partial<BudgetNode>) => Promise<void>;
  initializeTree: (options?: InitializeTreeOptions) => Promise<void>;
}

interface InitializeTreeOptions {
  includeBrands?: boolean;
  includeGenders?: boolean;
  includeCategories?: boolean;
  includeSubcategories?: boolean;
  defaultPercentages?: Record<string, number>;
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
      allocated: totalChildBudget,
      children: node.children.map(child => recalculatePercentages(child, totalChildBudget)),
    };
  }

  return { ...node, percentage };
}

// Helper function to convert API tree to frontend BudgetNode format
function convertApiTreeToNodes(apiNodes: any[]): BudgetNode[] {
  return apiNodes.map(node => ({
    id: node.id,
    name: node.name,
    level: node.level as HierarchyLevel,
    budget: node.budgetValue,
    allocated: node.allocatedValue,
    percentage: node.percentage / 100, // Convert from percent to decimal
    status: mapApiStatus(node.status),
    children: node.children ? convertApiTreeToNodes(node.children) : undefined,
    metadata: {
      brand: node.brandId,
      category: node.categoryId,
      gender: node.gender?.toLowerCase(),
    },
  }));
}

// Map API status to frontend status
function mapApiStatus(status: string): CardStatus {
  const map: Record<string, CardStatus> = {
    DRAFT: 'draft',
    VERIFIED: 'verified',
    WARNING: 'warning',
    ERROR: 'error',
    LOCKED: 'locked',
  };
  return map[status] || 'draft';
}

export function useBudgetData({ budgetId, initialData }: UseBudgetDataOptions = {}): UseBudgetDataReturn {
  const [data, setData] = useState<BudgetNode | null>(initialData || null);
  const [budget, setBudget] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Fetch budget tree from API
  const fetchData = useCallback(async () => {
    if (!budgetId) {
      // If no budgetId, use initial data
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.getTree(budgetId);

      if (response.success && response.data) {
        const { budget: budgetMeta, tree, nodeCount } = response.data;

        setBudget(budgetMeta);

        // Convert API tree to frontend format
        if (tree && tree.length > 0) {
          const nodes = convertApiTreeToNodes(tree);
          // Get root node (should be first item)
          setData(nodes[0] || null);
        } else if (initialData) {
          // No tree exists yet, use initial data
          setData(initialData);
        }
      } else if (initialData) {
        // API failed, fall back to initial data
        setData(initialData);
      }
    } catch (err) {
      console.error('Failed to fetch budget tree:', err);

      // Fall back to initial data if available
      if (initialData) {
        setData(initialData);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load budget data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, initialData]);

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Update budget value for a node
  const updateBudget = useCallback(async (nodeId: string, newBudget: number) => {
    if (!data) return;

    // Store original data for rollback
    const originalData = data;

    // Optimistic update
    const updatedData = updateNodeBudget(data, nodeId, newBudget);
    const recalculatedData = recalculatePercentages(updatedData);
    setData(recalculatedData);

    try {
      if (budgetId) {
        const response = await budgetsApi.updateNode(budgetId, nodeId, {
          budgetValue: newBudget,
        });

        if (!response.success) {
          // Revert on API error
          setData(originalData);
          setError('Failed to update budget');
        }
      }
    } catch (err) {
      // Revert on error
      setData(originalData);
      setError('Failed to update budget');
      console.error('Failed to update node:', err);
    }
  }, [data, budgetId]);

  // Update node with partial data
  const updateNode = useCallback(async (nodeId: string, updateData: Partial<BudgetNode>) => {
    if (!data) return;

    // Store original data for rollback
    const originalData = data;

    // Helper to update node in tree
    const updateNodeInTree = (node: BudgetNode): BudgetNode => {
      if (node.id === nodeId) {
        return { ...node, ...updateData };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeInTree),
        };
      }
      return node;
    };

    // Optimistic update
    const updatedData = updateNodeInTree(data);
    setData(updatedData);

    try {
      if (budgetId) {
        // Map frontend fields to API fields
        const apiData: Record<string, any> = {};
        if (updateData.budget !== undefined) apiData.budgetValue = updateData.budget;
        if (updateData.allocated !== undefined) apiData.allocatedValue = updateData.allocated;
        if (updateData.percentage !== undefined) apiData.percentage = updateData.percentage * 100;
        if (updateData.status !== undefined) apiData.status = updateData.status.toUpperCase();
        if (updateData.name !== undefined) apiData.name = updateData.name;

        const response = await budgetsApi.updateNode(budgetId, nodeId, apiData);

        if (!response.success) {
          // Revert on API error
          setData(originalData);
          setError('Failed to update node');
        }
      }
    } catch (err) {
      // Revert on error
      setData(originalData);
      setError('Failed to update node');
      console.error('Failed to update node:', err);
    }
  }, [data, budgetId]);

  // Initialize tree from master data
  const initializeTree = useCallback(async (options?: InitializeTreeOptions) => {
    if (!budgetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await budgetsApi.initializeTree(budgetId, options);

      if (response.success) {
        // Refresh to get the new tree
        await fetchData();
      } else {
        setError('Failed to initialize tree');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize tree');
      console.error('Failed to initialize tree:', err);
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    budget,
    isLoading,
    error,
    refresh,
    updateBudget,
    updateNode,
    initializeTree,
  };
}

export default useBudgetData;
