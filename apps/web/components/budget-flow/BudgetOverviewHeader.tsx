'use client';

import { cn } from '@/lib/utils';
import { BudgetNode } from './types';
import {
  formatCurrency,
  formatPercentage,
  calculateAllocation,
  getBudgetHealthColor,
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
    <Card className="mb-6" data-onboard="budget-header">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Budget Summary */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💰</span>
              <h1 className="text-2xl font-bold text-gray-900">
                {rootNode.name}
              </h1>
              {rootNode.metadata?.seasonYear && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {rootNode.metadata.seasonYear}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(rootNode.budget)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Allocated</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(allocated)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {isOverBudget ? 'Over Budget' : 'Remaining'}
                </p>
                <p className={cn(
                  'text-xl font-bold',
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(Math.abs(remaining))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Utilization</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPercentage(percentage)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    getBudgetHealthColor(percentage),
                  )}
                  style={{ width: `${Math.min(percentage * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2" data-onboard="view-toggle">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'stacked' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('stacked')}
                className="gap-1"
              >
                <Layers className="w-4 h-4" />
                Stacked
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="gap-1"
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
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCollapseAll}
                title="Collapse All (Ctrl+W)"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>

            {/* Other Actions */}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-1" />
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
