'use client';

import { cn } from '@/lib/utils';
import { BudgetNode } from './types';
import {
  formatCurrency,
  formatPercentage,
  calculateAllocation,
} from './utils/budget-calculations';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Layers,
  Download,
  RefreshCw,
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

  return (
    <div className="mb-8">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {rootNode.name}
          </h1>
          {rootNode.metadata?.seasonYear && (
            <p className="text-sm text-slate-500 mt-1">
              Season {rootNode.metadata.seasonYear}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('stacked')}
              className={cn(
                'gap-1.5 h-8',
                viewMode === 'stacked' && 'bg-white shadow-sm'
              )}
            >
              <Layers className="w-4 h-4" />
              List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'gap-1.5 h-8',
                viewMode === 'grid' && 'bg-white shadow-sm'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              Grid
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={onExpandAll} className="h-8 w-8 p-0">
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onCollapseAll} className="h-8 w-8 p-0">
            <ChevronUp className="w-4 h-4" />
          </Button>

          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 w-8 p-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="h-8">
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row - Inline */}
      <div className="flex items-center gap-8 text-sm">
        <div>
          <span className="text-slate-500">Budget</span>
          <span className="ml-2 font-semibold text-slate-900 tabular-nums">
            {formatCurrency(rootNode.budget)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Allocated</span>
          <span className="ml-2 font-semibold text-slate-700 tabular-nums">
            {formatCurrency(allocated)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">{isOverBudget ? 'Over' : 'Remaining'}</span>
          <span className={cn(
            'ml-2 font-semibold tabular-nums',
            isOverBudget ? 'text-red-600' : 'text-emerald-600'
          )}>
            {formatCurrency(Math.abs(remaining))}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                percentage > 1 ? 'bg-red-500' :
                percentage > 0.95 ? 'bg-amber-500' : 'bg-slate-800'
              )}
              style={{ width: `${Math.min(percentage * 100, 100)}%` }}
            />
          </div>
          <span className="text-slate-600 font-medium tabular-nums">
            {formatPercentage(percentage)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BudgetOverviewHeader;
