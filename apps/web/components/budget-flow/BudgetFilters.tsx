'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from './types';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type BudgetStatus = 'all' | 'draft' | 'verified' | 'warning' | 'error';

export interface FilterState {
  search: string;
  status: BudgetStatus;
  minBudget: number | null;
  maxBudget: number | null;
}

interface BudgetFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const STATUS_OPTIONS: { value: BudgetStatus; label: string; color: string }[] = [
  { value: 'all', label: 'All Status', color: 'bg-slate-400' },
  { value: 'verified', label: 'Verified', color: 'bg-emerald-500' },
  { value: 'draft', label: 'Draft', color: 'bg-slate-400' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-500' },
  { value: 'error', label: 'Error', color: 'bg-red-500' },
];

export function BudgetFilters({ filters, onFiltersChange, className }: BudgetFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      minBudget: null,
      maxBudget: null,
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.minBudget || filters.maxBudget;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Filter Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'border border-border bg-card',
              'text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:border-amber-300 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900',
              'transition-all duration-200'
            )}
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as BudgetStatus)}
            className={cn(
              'appearance-none pl-4 pr-10 py-2 rounded-lg',
              'border border-border bg-card',
              'text-sm font-medium text-slate-700 dark:text-neutral-300',
              'focus:outline-none focus:border-amber-300 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900',
              'cursor-pointer transition-all duration-200'
            )}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-400 pointer-events-none" />
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'gap-1.5',
            showAdvanced && 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 dark:bg-neutral-900 rounded-lg border border-border">
          <span className="text-sm text-slate-500 dark:text-neutral-400">Budget Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minBudget || ''}
              onChange={(e) => updateFilter('minBudget', e.target.value ? Number(e.target.value) : null)}
              className={cn(
                'w-32 px-3 py-1.5 rounded-lg',
                'border border-border bg-card',
                'text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500',
                'focus:outline-none focus:border-amber-300 dark:focus:border-amber-500'
              )}
            />
            <span className="text-slate-400 dark:text-neutral-500">—</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxBudget || ''}
              onChange={(e) => updateFilter('maxBudget', e.target.value ? Number(e.target.value) : null)}
              className={cn(
                'w-32 px-3 py-1.5 rounded-lg',
                'border border-border bg-card',
                'text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500',
                'focus:outline-none focus:border-amber-300 dark:focus:border-amber-500'
              )}
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2 ml-4">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter('status', option.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filters.status === option.value
                    ? 'bg-slate-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                    : 'bg-card border border-border text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-700'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', option.color)} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to filter budget nodes
export function filterBudgetNodes(
  nodes: BudgetNode[],
  filters: FilterState
): BudgetNode[] {
  return nodes.filter((node) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!node.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    if (filters.status !== 'all' && node.status !== filters.status) {
      return false;
    }

    // Budget range filter
    if (filters.minBudget !== null && node.budget < filters.minBudget) {
      return false;
    }
    if (filters.maxBudget !== null && node.budget > filters.maxBudget) {
      return false;
    }

    return true;
  });
}

// Hook for managing filter state
export function useBudgetFilters() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    minBudget: null,
    maxBudget: null,
  });

  return { filters, setFilters };
}

export default BudgetFilters;
