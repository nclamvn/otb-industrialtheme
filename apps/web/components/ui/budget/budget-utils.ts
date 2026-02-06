import { BudgetLevel, BudgetHealthStatus } from './types';

export const getLevelStyles = (level: BudgetLevel) => {
  // Distinct colors for each level - easy to differentiate
  // Light theme: Blue → Purple → Teal → Amber → Rose
  // Dark theme: Emerald → Cyan → Violet → Orange → Pink
  const styles: Record<BudgetLevel, { band: string; bg: string }> = {
    1: { band: 'border-l-blue-600 dark:border-l-emerald-500', bg: 'bg-card' },
    2: { band: 'border-l-purple-600 dark:border-l-cyan-500', bg: 'bg-muted/50 dark:bg-neutral-900' },
    3: { band: 'border-l-teal-600 dark:border-l-violet-500', bg: 'bg-card' },
    4: { band: 'border-l-amber-500 dark:border-l-orange-500', bg: 'bg-muted/50 dark:bg-neutral-900' },
    5: { band: 'border-l-rose-500 dark:border-l-pink-500', bg: 'bg-card' },
  };
  return styles[level];
};

export const getBudgetHealth = (percentage: number): BudgetHealthStatus => {
  if (percentage > 1) return 'over';
  if (percentage >= 0.9) return 'warning';
  return 'healthy';
};

export const getHealthStyles = (health: BudgetHealthStatus) => {
  const styles: Record<BudgetHealthStatus, { bar: string; text: string; bg: string }> = {
    healthy: { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
    warning: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
    over: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
  };
  return styles[health];
};

export const formatBudgetCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatBudgetPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};
