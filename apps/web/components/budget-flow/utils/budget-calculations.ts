import { BudgetNode } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const calculateAllocation = (node: BudgetNode): {
  allocated: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
} => {
  const allocated = node.children?.reduce((sum, child) => sum + child.budget, 0) || 0;
  const remaining = node.budget - allocated;
  const percentage = node.budget > 0 ? allocated / node.budget : 0;
  const isOverBudget = allocated > node.budget;

  return { allocated, remaining, percentage, isOverBudget };
};

export const getBudgetHealthColor = (percentage: number): string => {
  if (percentage <= 0.5) return 'bg-green-500';
  if (percentage <= 0.8) return 'bg-green-500';
  if (percentage <= 0.95) return 'bg-yellow-500';
  if (percentage <= 1) return 'bg-orange-500';
  return 'bg-red-500';
};

export const calculateGap = (budget: number, actual: number): {
  gap: number;
  gapPercentage: number;
  isUnder: boolean;
} => {
  const gap = budget - actual;
  const gapPercentage = budget > 0 ? Math.abs(gap) / budget : 0;
  const isUnder = gap > 0;

  return { gap, gapPercentage, isUnder };
};

export const getAllNodeIds = (node: BudgetNode): string[] => {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach(child => {
      ids.push(...getAllNodeIds(child));
    });
  }
  return ids;
};

export const findNodeById = (root: BudgetNode, id: string): BudgetNode | null => {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};
