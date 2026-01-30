'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from './types';
import { getHierarchyColor, getStatusColor } from './utils/hierarchy-colors';
import { formatCurrency, formatPercentage, calculateAllocation } from './utils/budget-calculations';
import { BudgetAllocationVisual } from './MiniDonutChart';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Pencil,
  Check,
  X
} from 'lucide-react';

// Color palette for chart segments
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
];

interface ExpandableCardProps {
  node: BudgetNode;
  onDrillDown?: (node: BudgetNode) => void;
  onBudgetUpdate?: (nodeId: string, newBudget: number) => void;
}

// Inline Editable Budget Input Component
function EditableBudget({
  value,
  onSave,
  onCancel,
  className,
}: {
  value: number;
  onSave: (newValue: number) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const numValue = parseFloat(inputValue.replace(/,/g, ''));
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'pl-7 pr-3 py-2 w-40 rounded-lg',
            'border-2 border-amber-300 bg-white',
            'text-xl font-bold tabular-nums text-slate-900',
            'focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
            className
          )}
        />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleSave(); }}
        className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Editable Child Row Component
function EditableChildRow({
  child,
  parentBudget,
  onBudgetUpdate,
  onDrillDown,
  color,
}: {
  child: BudgetNode;
  parentBudget: number;
  onBudgetUpdate?: (nodeId: string, newBudget: number) => void;
  onDrillDown?: (node: BudgetNode) => void;
  color?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const childStatus = getStatusColor(child.status);
  const childAllocation = calculateAllocation(child);
  const shareOfParent = child.budget / parentBudget;

  const handleSave = (newValue: number) => {
    onBudgetUpdate?.(child.id, newValue);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'group p-4 rounded-xl transition-all duration-200',
        'bg-slate-50/50 hover:bg-amber-50/50',
        'border border-transparent hover:border-amber-200',
        !isEditing && 'cursor-pointer'
      )}
      onClick={() => !isEditing && onDrillDown?.(child)}
    >
      <div className="flex items-center gap-3 mb-2">
        {/* Color indicator - matches chart */}
        <div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: color || '#64748b' }}
        />

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{child.name}</span>
            <span className={cn('w-1.5 h-1.5 rounded-full', childStatus.dot)} />
          </div>
        </div>

        {/* Amount + Percentage or Edit Mode */}
        {isEditing ? (
          <EditableBudget
            value={child.budget}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-bold text-slate-900 tabular-nums">
                {formatCurrency(child.budget)}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {(shareOfParent * 100).toFixed(1)}%
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Mini Progress Bar */}
      <div className="ml-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              childAllocation.percentage > 1 ? 'bg-red-400' :
              childAllocation.percentage > 0.95 ? 'bg-amber-400' : 'bg-slate-500'
            )}
            style={{ width: `${Math.min(childAllocation.percentage * 100, 100)}%` }}
          />
        </div>
        <span className={cn(
          'text-xs tabular-nums font-medium min-w-[60px] text-right',
          childAllocation.isOverBudget ? 'text-red-500' : 'text-slate-500'
        )}>
          {formatPercentage(childAllocation.percentage)} used
        </span>
      </div>
    </div>
  );
}

export function ExpandableCard({ node, onDrillDown, onBudgetUpdate }: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingMain, setIsEditingMain] = useState(false);
  const colors = getHierarchyColor(node.level);
  const statusColors = getStatusColor(node.status);
  const { allocated, remaining, percentage, isOverBudget } = calculateAllocation(node);
  const hasChildren = node.children && node.children.length > 0;

  const handleMainBudgetSave = (newValue: number) => {
    onBudgetUpdate?.(node.id, newValue);
    setIsEditingMain(false);
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        'bg-white border rounded-2xl overflow-hidden',
        isExpanded ? 'border-amber-300 shadow-lg shadow-amber-100/50' : 'border-slate-200',
        'hover:border-amber-200'
      )}
    >
      {/* Card Header - Always visible */}
      <div
        onClick={() => !isEditingMain && setIsExpanded(!isExpanded)}
        className={cn(
          'w-full text-left p-6 transition-all duration-200',
          isExpanded ? 'bg-gradient-to-br from-amber-50/80 to-white' : 'bg-white hover:bg-amber-50/30',
          !isEditingMain && 'cursor-pointer'
        )}
      >
        <div className="flex items-start gap-4">
          {/* Left Color Band */}
          <div className={cn('w-1.5 self-stretch rounded-full flex-shrink-0 min-h-[70px]', colors.accent)} />

          <div className="flex-1 min-w-0">
            {/* Top Row: Name + Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={cn('text-lg font-semibold', colors.text)}>
                  {node.name}
                </span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50">
                  <span className={cn('w-1.5 h-1.5 rounded-full', statusColors.dot)} />
                  <span className={cn('text-xs font-medium', statusColors.badge)}>{node.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Edit Button */}
                {!isEditingMain && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingMain(true);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {/* Expand/Collapse Button */}
                {hasChildren && (
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                    isExpanded ? 'bg-amber-100' : 'bg-slate-100'
                  )}>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Budget Amount - Editable */}
            {isEditingMain ? (
              <div className="mb-3">
                <EditableBudget
                  value={node.budget}
                  onSave={handleMainBudgetSave}
                  onCancel={() => setIsEditingMain(false)}
                  className="text-2xl"
                />
              </div>
            ) : (
              <div className={cn('text-3xl font-bold tracking-tight tabular-nums mb-3', colors.text)}>
                {formatCurrency(node.budget)}
              </div>
            )}

            {/* Progress Bar + Stats */}
            <div className="space-y-2">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    percentage > 1 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                    percentage > 0.95 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-slate-600 to-slate-800'
                  )}
                  style={{ width: `${Math.min(percentage * 100, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {formatPercentage(node.percentage)} of total
                </span>
                <div className="flex items-center gap-1">
                  {isOverBudget ? (
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                  ) : remaining === 0 ? (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  <span className={cn(
                    'font-semibold tabular-nums',
                    isOverBudget ? 'text-red-600' : remaining === 0 ? 'text-slate-500' : 'text-emerald-600'
                  )}>
                    {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(remaining))} {isOverBudget ? 'over' : 'remaining'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content - Budget Breakdown */}
      {isExpanded && hasChildren && (
        <div className="px-6 pb-6 border-t border-slate-100">
          {/* Visual Chart Section */}
          <div className="py-5 border-b border-slate-100">
            <BudgetAllocationVisual
              items={node.children!.map((child, index) => ({
                id: child.id,
                name: child.name,
                budget: child.budget,
                color: CHART_COLORS[index % CHART_COLORS.length],
              }))}
              totalBudget={node.budget}
              allocatedBudget={allocated}
            />
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between py-4">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Budget Allocation
            </h4>
            <span className="text-xs text-slate-400">
              {node.children!.length} items
            </span>
          </div>

          {/* Allocation Breakdown - Editable */}
          <div className="space-y-3">
            {node.children!.map((child, index) => (
              <EditableChildRow
                key={child.id}
                child={child}
                parentBudget={node.budget}
                onBudgetUpdate={onBudgetUpdate}
                onDrillDown={onDrillDown}
                color={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </div>

          {/* Summary Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total Allocated</span>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatCurrency(allocated)}
                </span>
                <div className={cn(
                  'px-2 py-1 rounded-lg text-xs font-semibold',
                  isOverBudget ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                )}>
                  {isOverBudget ? 'Over budget' : `${formatCurrency(remaining)} available`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpandableCard;
