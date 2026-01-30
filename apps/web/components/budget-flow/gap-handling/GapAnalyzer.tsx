'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from '../types';
import { formatCurrency } from '../utils/budget-calculations';
import {
  GapAnalysis,
  analyzeGaps,
  SEVERITY_COLORS,
} from './types';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GapAnalyzerProps {
  data: BudgetNode;
  onNodeSelect?: (nodeId: string) => void;
  className?: string;
}

export function GapAnalyzer({ data, onNodeSelect, className }: GapAnalyzerProps) {
  // Analyze all gaps in the tree
  const gaps = useMemo(() => analyzeGaps(data), [data]);

  // Summary stats
  const summary = useMemo(() => {
    const critical = gaps.filter((g) => g.severity === 'critical').length;
    const warning = gaps.filter((g) => g.severity === 'warning').length;
    const info = gaps.filter((g) => g.severity === 'info').length;
    const totalOver = gaps
      .filter((g) => g.type === 'over')
      .reduce((sum, g) => sum + Math.abs(g.gap), 0);
    const totalUnder = gaps
      .filter((g) => g.type === 'under')
      .reduce((sum, g) => sum + g.gap, 0);

    return { critical, warning, info, totalOver, totalUnder };
  }, [gaps]);

  // Sort gaps by severity
  const sortedGaps = useMemo(() => {
    const severityOrder = { critical: 0, warning: 1, info: 2, ok: 3 };
    return [...gaps].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }, [gaps]);

  const getTypeIcon = (type: GapAnalysis['type']) => {
    switch (type) {
      case 'over':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'under':
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400 dark:text-neutral-500" />;
    }
  };

  const getSeverityIcon = (severity: GapAnalysis['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'info':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (gaps.length === 0) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h4 className="font-medium text-slate-800 dark:text-neutral-100 mb-1">All Balanced</h4>
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          No significant gaps detected in budget allocation.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-red-50 border border-red-100">
          <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
          <div className="text-xs text-red-600">Critical</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
          <div className="text-2xl font-bold text-amber-600">{summary.warning}</div>
          <div className="text-xs text-amber-600">Warning</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
          <div className="text-xs text-blue-600">Info</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800">
          <div className="text-2xl font-bold text-slate-600 dark:text-neutral-300">{gaps.length}</div>
          <div className="text-xs text-slate-600 dark:text-neutral-400">Total</div>
        </div>
      </div>

      {/* Over/Under Summary */}
      <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-neutral-900">
        <div className="flex-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <span className="text-sm text-slate-600 dark:text-neutral-400">Over Budget:</span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totalOver)}
          </span>
        </div>
        <div className="w-px bg-slate-200 dark:bg-neutral-700" />
        <div className="flex-1 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-slate-600 dark:text-neutral-400">Under Budget:</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {formatCurrency(summary.totalUnder)}
          </span>
        </div>
      </div>

      {/* Gap List */}
      <div className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-semibold">
          Gap Details
        </h4>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {sortedGaps.map((gap) => {
            const colors = SEVERITY_COLORS[gap.severity];

            return (
              <div
                key={gap.nodeId}
                onClick={() => onNodeSelect?.(gap.nodeId)}
                className={cn(
                  'p-3 rounded-xl border cursor-pointer transition-all',
                  colors.bg,
                  colors.border,
                  'hover:shadow-md'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('p-1 rounded', colors.badge)}>
                      {getSeverityIcon(gap.severity)}
                    </span>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-neutral-100">
                        {gap.nodeName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400">
                        {gap.nodePath.slice(0, -1).join(' → ')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(gap.type)}
                    <span className={cn('text-sm font-medium', colors.text)}>
                      {gap.type === 'over' ? 'Over' : gap.type === 'under' ? 'Under' : 'Balanced'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div
                      className={cn(
                        'font-bold tabular-nums',
                        gap.type === 'over' ? 'text-red-600' : 'text-amber-600'
                      )}
                    >
                      {gap.type === 'over' ? '+' : '-'}
                      {formatCurrency(Math.abs(gap.gap))}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">
                      {Math.abs(gap.gapPercent).toFixed(1)}% variance
                    </div>
                  </div>
                </div>

                {/* Budget vs Allocated mini-bar */}
                <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-neutral-700/50">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
                    <span>Budget: {formatCurrency(gap.budget)}</span>
                    <span>Allocated: {formatCurrency(gap.allocated)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        gap.type === 'over' ? 'bg-red-400' : 'bg-amber-400'
                      )}
                      style={{
                        width: `${Math.min((gap.allocated / gap.budget) * 100, 150)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GapAnalyzer;
