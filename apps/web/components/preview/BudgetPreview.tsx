'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface CategoryBreakdown {
  name: string;
  allocated: number;
  spent: number;
  percentage: number;
}

interface BudgetTrend {
  month: string;
  planned: number;
  actual: number;
}

interface BudgetPreviewProps {
  budgetId: string;
  budgetName: string;
  season: string;
  totalBudget: number;
  allocated: number;
  spent: number;
  status: 'draft' | 'approved' | 'locked';
  categories: CategoryBreakdown[];
  trends: BudgetTrend[];
  lastUpdated: string;
  onViewDetails?: () => void;
  className?: string;
}

export function BudgetPreview({
  budgetId,
  budgetName,
  season,
  totalBudget,
  allocated,
  spent,
  status,
  categories,
  trends,
  lastUpdated,
  onViewDetails,
  className,
}: BudgetPreviewProps) {
  const utilizationPercent = Math.round((spent / totalBudget) * 100);
  const allocationPercent = Math.round((allocated / totalBudget) * 100);
  const remaining = totalBudget - spent;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'locked': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Summary Section */}
      <div className="p-4 space-y-4">
        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{budgetName}</h3>
            <p className="text-sm text-muted-foreground">{season}</p>
          </div>
          <Badge className={cn('text-xs', getStatusColor(status))}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              Total Budget
            </div>
            <p className="text-lg font-semibold font-mono">
              ${totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Percent className="w-3 h-3" />
              Utilized
            </div>
            <p className="text-lg font-semibold font-mono text-[#127749]">
              {utilizationPercent}%
            </p>
          </div>
        </div>

        {/* Utilization Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Budget Utilization</span>
            <span className="font-medium">${spent.toLocaleString()} / ${totalBudget.toLocaleString()}</span>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            {/* Allocated bar */}
            <div
              className="absolute inset-y-0 left-0 bg-[#D7B797]/50 transition-all"
              style={{ width: `${allocationPercent}%` }}
            />
            {/* Spent bar */}
            <div
              className="absolute inset-y-0 left-0 bg-[#127749] transition-all"
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#127749]" /> Spent
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#D7B797]/50" /> Allocated
            </span>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-[#127749]/5 to-transparent">
          <div>
            <p className="text-xs text-muted-foreground">Remaining Budget</p>
            <p className="text-xl font-bold font-mono text-[#127749]">
              ${remaining.toLocaleString()}
            </p>
          </div>
          {remaining < totalBudget * 0.2 && (
            <Badge variant="destructive" className="text-[10px]">
              Low Balance
            </Badge>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <PieChart className="w-4 h-4 text-[#D7B797]" />
          Category Breakdown
        </div>
        <div className="space-y-2">
          {categories.slice(0, 5).map((cat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{cat.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {cat.percentage}%
                  </span>
                </div>
                <Progress value={cat.percentage} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Mini Chart */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="w-4 h-4 text-[#127749]" />
          Monthly Trend
        </div>
        <div className="flex items-end justify-between h-16 gap-1">
          {trends.map((trend, idx) => {
            const maxValue = Math.max(...trends.map(t => Math.max(t.planned, t.actual)));
            const plannedHeight = (trend.planned / maxValue) * 100;
            const actualHeight = (trend.actual / maxValue) * 100;
            const isOverBudget = trend.actual > trend.planned;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-12">
                  <div
                    className="w-2 bg-[#D7B797]/50 rounded-t transition-all"
                    style={{ height: `${plannedHeight}%` }}
                  />
                  <div
                    className={cn(
                      'w-2 rounded-t transition-all',
                      isOverBudget ? 'bg-red-500' : 'bg-[#127749]'
                    )}
                    style={{ height: `${actualHeight}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{trend.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-[#D7B797]/50" /> Planned
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-[#127749]" /> Actual
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdated}
          </span>
          <Button
            size="sm"
            onClick={onViewDetails}
            className="bg-[#127749] hover:bg-[#0d5a36]"
          >
            View Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mock data generator
export function generateMockBudgetPreview(): Omit<BudgetPreviewProps, 'onViewDetails' | 'className'> {
  return {
    budgetId: 'budget-001',
    budgetName: 'Spring/Summer 2025 Budget',
    season: 'SS25',
    totalBudget: 5000000,
    allocated: 4200000,
    spent: 3150000,
    status: 'approved',
    categories: [
      { name: 'Women\'s Bags', allocated: 1500000, spent: 1200000, percentage: 38 },
      { name: 'Men\'s Shoes', allocated: 1000000, spent: 750000, percentage: 24 },
      { name: 'Accessories', allocated: 800000, spent: 600000, percentage: 19 },
      { name: 'Ready-to-Wear', allocated: 600000, spent: 400000, percentage: 13 },
      { name: 'Small Leather Goods', allocated: 300000, spent: 200000, percentage: 6 },
    ],
    trends: [
      { month: 'Jan', planned: 800000, actual: 750000 },
      { month: 'Feb', planned: 850000, actual: 900000 },
      { month: 'Mar', planned: 900000, actual: 850000 },
      { month: 'Apr', planned: 950000, actual: 650000 },
    ],
    lastUpdated: '2 hours ago',
  };
}
