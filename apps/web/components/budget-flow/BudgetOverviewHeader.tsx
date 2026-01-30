'use client';

import { cn } from '@/lib/utils';
import { BudgetNode } from './types';
import {
  formatCurrency,
  formatPercentage,
  calculateAllocation,
} from './utils/budget-calculations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Layers,
  Download,
  RefreshCw,
  Wallet,
  TrendingUp,
  PiggyBank,
  Percent,
} from 'lucide-react';

interface BudgetOverviewHeaderProps {
  rootNode: BudgetNode;
  viewMode: 'stacked' | 'grid';
  onViewModeChange: (mode: 'stacked' | 'grid') => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

export function BudgetOverviewHeader({
  rootNode,
  viewMode,
  onViewModeChange,
  onExpandAll,
  onCollapseAll,
  onExport,
  onRefresh,
}: BudgetOverviewHeaderProps) {
  const { allocated, remaining, percentage, isOverBudget } = calculateAllocation(rootNode);

  // Progress bar color
  const getProgressColor = () => {
    if (percentage > 1) return 'bg-red-500';
    if (percentage > 0.95) return 'bg-amber-500';
    return 'bg-slate-800';
  };

  return (
    <Card className="mb-6 border-slate-200 shadow-sm" data-onboard="budget-header">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Budget Summary */}
          <div className="flex-1">
            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {rootNode.name}
                </h1>
                {rootNode.metadata?.seasonYear && (
                  <span className="text-sm text-slate-500">
                    Season {rootNode.metadata.seasonYear}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Grid - Clean, minimal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Total Budget */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Wallet className="w-4 h-4" />
                  Total Budget
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatCurrency(rootNode.budget)}
                </p>
              </div>

              {/* Allocated */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  Allocated
                </div>
                <p className="text-2xl font-bold text-slate-700 tracking-tight">
                  {formatCurrency(allocated)}
                </p>
              </div>

              {/* Remaining/Over */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <PiggyBank className="w-4 h-4" />
                  {isOverBudget ? 'Over Budget' : 'Remaining'}
                </div>
                <p className={cn(
                  'text-2xl font-bold tracking-tight',
                  isOverBudget ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {formatCurrency(Math.abs(remaining))}
                </p>
              </div>

              {/* Utilization */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Percent className="w-4 h-4" />
                  Utilization
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatPercentage(percentage)}
                </p>
              </div>
            </div>

            {/* Progress Bar - Minimal */}
            <div className="mt-6">
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    getProgressColor(),
                  )}
                  style={{ width: `${Math.min(percentage * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions - Clean buttons */}
          <div className="flex flex-wrap items-center gap-2" data-onboard="view-toggle">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'stacked' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('stacked')}
                className={cn(
                  'gap-1.5',
                  viewMode === 'stacked' && 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                <Layers className="w-4 h-4" />
                Stacked
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'gap-1.5',
                  viewMode === 'grid' && 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
                Grid
              </Button>
            </div>

            {/* Expand/Collapse */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onExpandAll}
                title="Expand All (Ctrl+E)"
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCollapseAll}
                title="Collapse All (Ctrl+W)"
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>

            {/* Other Actions */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BudgetOverviewHeader;
