'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils/budget-calculations';
import {
  BudgetVersion,
  VersionComparison as VersionComparisonType,
  ComparisonChange,
  compareVersions,
  VERSION_STATUS_COLORS,
} from './types';
import {
  ArrowRight,
  Plus,
  Minus,
  Equal,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface VersionComparisonProps {
  leftVersion: BudgetVersion;
  rightVersion: BudgetVersion;
  className?: string;
}

function ChangeRow({
  change,
  depth = 0,
}: {
  change: ComparisonChange;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = change.children && change.children.length > 0;

  const statusColors = {
    added: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: <Plus className="w-4 h-4" />,
      label: 'Added',
    },
    removed: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: <Minus className="w-4 h-4" />,
      label: 'Removed',
    },
    modified: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: <ArrowRight className="w-4 h-4" />,
      label: 'Modified',
    },
    unchanged: {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      icon: <Equal className="w-4 h-4" />,
      label: 'Unchanged',
    },
  };

  const colors = statusColors[change.status];

  return (
    <>
      <div
        className={cn(
          'flex items-center py-2 px-3 border-b border-slate-100 transition-colors',
          colors.bg,
          hasChildren && 'cursor-pointer hover:bg-opacity-80'
        )}
        style={{ paddingLeft: `${12 + depth * 24}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-5 mr-2">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          ) : null}
        </div>

        {/* Status Icon */}
        <div className={cn('p-1 rounded mr-3', colors.text)}>{colors.icon}</div>

        {/* Node Name & Path */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-800">{change.nodeName}</div>
          {depth === 0 && change.nodePath.length > 1 && (
            <div className="text-xs text-slate-500 truncate">
              {change.nodePath.slice(0, -1).join(' → ')}
            </div>
          )}
        </div>

        {/* Values */}
        <div className="flex items-center gap-4">
          {/* Left Value */}
          <div className="text-right w-28">
            {change.leftValue !== undefined ? (
              <span
                className={cn(
                  'font-mono text-sm tabular-nums',
                  change.status === 'removed' ? 'text-red-600 line-through' : 'text-slate-600'
                )}
              >
                {formatCurrency(change.leftValue)}
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-slate-300" />

          {/* Right Value */}
          <div className="text-right w-28">
            {change.rightValue !== undefined ? (
              <span
                className={cn(
                  'font-mono text-sm tabular-nums',
                  change.status === 'added' ? 'text-green-600 font-medium' : 'text-slate-800 font-medium'
                )}
              >
                {formatCurrency(change.rightValue)}
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>

          {/* Diff */}
          <div className="w-24 text-right">
            {change.diff !== undefined && change.diff !== 0 ? (
              <span
                className={cn(
                  'flex items-center justify-end gap-1 font-mono text-sm tabular-nums',
                  change.diff > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change.diff > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {change.diff > 0 ? '+' : ''}
                {formatCurrency(change.diff)}
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>

          {/* Diff Percent */}
          <div className="w-16 text-right">
            {change.diffPercent !== undefined && change.diffPercent !== 0 ? (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs font-mono',
                  change.diffPercent > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                {change.diffPercent > 0 ? '+' : ''}
                {change.diffPercent.toFixed(1)}%
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <>
          {change.children!.map((child) => (
            <ChangeRow key={child.nodeId} change={child} depth={depth + 1} />
          ))}
        </>
      )}
    </>
  );
}

export function VersionComparison({
  leftVersion,
  rightVersion,
  className,
}: VersionComparisonProps) {
  // Compare versions
  const comparison = useMemo(
    () => compareVersions(leftVersion, rightVersion),
    [leftVersion, rightVersion]
  );

  const leftColors = VERSION_STATUS_COLORS[leftVersion.status];
  const rightColors = VERSION_STATUS_COLORS[rightVersion.status];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-800">Version Comparison</h3>
        </div>
      </div>

      {/* Version Headers */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Version */}
        <div
          className={cn(
            'p-4 rounded-xl border',
            leftColors.bg,
            leftColors.border
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">
              v{leftVersion.versionNumber}.0
            </span>
            <Badge className={cn('text-xs', leftColors.bg, leftColors.text)}>
              {leftVersion.status}
            </Badge>
          </div>
          <div className="text-sm text-slate-600">{leftVersion.name}</div>
          <div className="text-xs text-slate-500 mt-1">
            {formatCurrency(leftVersion.snapshot.budget)} total
          </div>
        </div>

        {/* Right Version */}
        <div
          className={cn(
            'p-4 rounded-xl border',
            rightColors.bg,
            rightColors.border
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">
              v{rightVersion.versionNumber}.0
            </span>
            <Badge className={cn('text-xs', rightColors.bg, rightColors.text)}>
              {rightVersion.status}
            </Badge>
            {rightVersion.isCurrent && (
              <Badge className="text-xs bg-amber-500 text-white">Current</Badge>
            )}
          </div>
          <div className="text-sm text-slate-600">{rightVersion.name}</div>
          <div className="text-xs text-slate-500 mt-1">
            {formatCurrency(rightVersion.snapshot.budget)} total
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
          <div className="text-2xl font-bold text-green-600">
            {comparison.summary.added}
          </div>
          <div className="text-xs text-green-600">Added</div>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
          <div className="text-2xl font-bold text-red-600">
            {comparison.summary.removed}
          </div>
          <div className="text-xs text-red-600">Removed</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {comparison.summary.modified}
          </div>
          <div className="text-xs text-amber-600">Modified</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div className="text-2xl font-bold text-slate-600">
            {comparison.summary.unchanged}
          </div>
          <div className="text-xs text-slate-600">Unchanged</div>
        </div>
        <div
          className={cn(
            'p-3 rounded-xl border text-center',
            comparison.summary.totalBudgetDiff > 0
              ? 'bg-green-50 border-green-100'
              : comparison.summary.totalBudgetDiff < 0
              ? 'bg-red-50 border-red-100'
              : 'bg-slate-50 border-slate-100'
          )}
        >
          <div
            className={cn(
              'text-lg font-bold tabular-nums',
              comparison.summary.totalBudgetDiff > 0
                ? 'text-green-600'
                : comparison.summary.totalBudgetDiff < 0
                ? 'text-red-600'
                : 'text-slate-600'
            )}
          >
            {comparison.summary.totalBudgetDiff > 0 ? '+' : ''}
            {formatCurrency(comparison.summary.totalBudgetDiff)}
          </div>
          <div
            className={cn(
              'text-xs',
              comparison.summary.totalBudgetDiff > 0
                ? 'text-green-600'
                : comparison.summary.totalBudgetDiff < 0
                ? 'text-red-600'
                : 'text-slate-600'
            )}
          >
            {comparison.summary.totalBudgetDiffPercent > 0 ? '+' : ''}
            {comparison.summary.totalBudgetDiffPercent.toFixed(1)}% Total
          </div>
        </div>
      </div>

      {/* Changes Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center py-2 px-3 bg-slate-100 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="w-5 mr-2"></div>
          <div className="w-8 mr-3"></div>
          <div className="flex-1">Category</div>
          <div className="w-28 text-right">v{leftVersion.versionNumber}</div>
          <div className="w-8"></div>
          <div className="w-28 text-right">v{rightVersion.versionNumber}</div>
          <div className="w-24 text-right">Change</div>
          <div className="w-16 text-right">%</div>
        </div>

        {/* Changes */}
        {comparison.changes.length > 0 ? (
          comparison.changes.map((change) => (
            <ChangeRow key={change.nodeId} change={change} />
          ))
        ) : (
          <div className="p-8 text-center text-slate-500">
            No differences found between these versions
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionComparison;
