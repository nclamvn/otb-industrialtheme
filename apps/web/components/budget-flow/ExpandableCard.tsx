'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode } from './types';
import {
  BudgetProgressBar,
  BudgetStatusBadge,
  getLevelStyles,
  getBudgetHealth,
  getHealthStyles,
  formatBudgetCurrency,
  formatBudgetPercentage,
  BudgetCardStatus,
  BudgetLevel,
} from '@/components/ui/budget';
import { BudgetAllocationVisual } from './MiniDonutChart';
import { calculateAllocation } from './utils/budget-calculations';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Pencil,
  Check,
  X,
  Wand2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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

// Map BudgetNode status to BudgetCardStatus
function mapStatus(status: string): BudgetCardStatus {
  const statusMap: Record<string, BudgetCardStatus> = {
    draft: 'draft',
    verified: 'verified',
    warning: 'warning',
    error: 'error',
    locked: 'locked',
  };
  return statusMap[status] || 'draft';
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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 font-medium">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'pl-7 pr-3 py-2 w-40 rounded-xl',
            'border-2 border-amber-300 bg-white dark:bg-neutral-950',
            'text-xl font-bold tabular-nums text-slate-900 dark:text-neutral-100',
            'focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
            className
          )}
        />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleSave(); }}
        className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="p-2 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors"
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
  const childAllocation = calculateAllocation(child);
  const shareOfParent = child.budget / parentBudget;
  const health = getBudgetHealth(childAllocation.percentage);
  const healthStyles = getHealthStyles(health);

  const handleSave = (newValue: number) => {
    onBudgetUpdate?.(child.id, newValue);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'group p-4 rounded-xl transition-all duration-200',
        'bg-slate-50/50 dark:bg-neutral-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/50',
        'border border-transparent hover:border-amber-200 dark:hover:border-amber-800',
        !isEditing && 'cursor-pointer'
      )}
      onClick={() => !isEditing && onDrillDown?.(child)}
    >
      <div className="flex items-center gap-3 mb-2">
        {/* Color indicator - matches chart */}
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: color || '#64748b' }}
        />

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 dark:text-neutral-200 truncate">{child.name}</span>
            <BudgetStatusBadge status={mapStatus(child.status)} />
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
              <div className="font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                {formatBudgetCurrency(child.budget)}
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">
                {(shareOfParent * 100).toFixed(1)}%
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-xl text-slate-400 dark:text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Mini Progress Bar using design system */}
      <div className="ml-4 flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', healthStyles.bar)}
            style={{ width: `${Math.min(childAllocation.percentage * 100, 100)}%` }}
          />
        </div>
        <span className={cn(
          'text-xs tabular-nums font-medium min-w-[60px] text-right',
          healthStyles.text
        )}>
          {formatBudgetPercentage(childAllocation.percentage)} used
        </span>
      </div>
    </div>
  );
}

export function ExpandableCard({ node, onDrillDown, onBudgetUpdate }: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingMain, setIsEditingMain] = useState(false);

  // Use unified design system
  const level = Math.min(Math.max(node.level, 1), 5) as BudgetLevel;
  const levelStyles = getLevelStyles(level);
  const { allocated, remaining, percentage, isOverBudget } = calculateAllocation(node);
  const health = getBudgetHealth(percentage);
  const healthStyles = getHealthStyles(health);
  const hasChildren = node.children && node.children.length > 0;

  const handleMainBudgetSave = (newValue: number) => {
    onBudgetUpdate?.(node.id, newValue);
    setIsEditingMain(false);
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        'border overflow-hidden',
        'rounded-xl', // Unified: rounded-xl (12px)
        'shadow-sm hover:shadow-md', // Unified: shadow-sm default, shadow-md hover
        levelStyles.bg,
        isExpanded ? 'border-amber-300 shadow-lg shadow-amber-100/50 dark:shadow-amber-900/30' : 'border-slate-200 dark:border-neutral-800',
        'hover:border-amber-200'
      )}
    >
      {/* Card Header - Always visible */}
      <div
        onClick={() => !isEditingMain && setIsExpanded(!isExpanded)}
        className={cn(
          'w-full text-left p-4 transition-all duration-200', // Unified: p-4 (16px)
          'border-l-4', // Unified: border-l-4 (4px)
          levelStyles.band,
          isExpanded ? 'bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/50 dark:to-neutral-950' : 'bg-white dark:bg-neutral-950 hover:bg-amber-50/30 dark:hover:bg-amber-950/30',
          !isEditingMain && 'cursor-pointer'
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Top Row: Name + Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-slate-900 dark:text-neutral-100">
                  {node.name}
                </span>
                <BudgetStatusBadge status={mapStatus(node.status)} />
              </div>

              <div className="flex items-center gap-2">
                {/* Edit Button */}
                {!isEditingMain && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingMain(true);
                    }}
                    className="p-2 rounded-xl text-slate-400 dark:text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {/* Expand/Collapse Button */}
                {hasChildren && (
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                    isExpanded ? 'bg-amber-100 dark:bg-amber-900' : 'bg-slate-100 dark:bg-neutral-800'
                  )}>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500 dark:text-neutral-400" />
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
              <div className="text-3xl font-bold tracking-tight tabular-nums mb-3 text-slate-900 dark:text-neutral-100">
                {formatBudgetCurrency(node.budget)}
              </div>
            )}

            {/* Progress Bar using design system */}
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', healthStyles.bar)}
                  style={{ width: `${Math.min(percentage * 100, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-neutral-400">
                  {formatBudgetPercentage(node.percentage)} of total
                </span>
                <div className="flex items-center gap-1">
                  {isOverBudget ? (
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                  ) : remaining === 0 ? (
                    <Minus className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                  )}
                  <span className={cn('font-semibold tabular-nums', healthStyles.text)}>
                    {isOverBudget ? '+' : ''}{formatBudgetCurrency(Math.abs(remaining))} {isOverBudget ? 'over' : 'remaining'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content - No Children: Show SKU Proposal Link */}
      <AnimatePresence>
        {isExpanded && !hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className={cn('px-4 pb-4 border-t border-slate-100 dark:border-neutral-800 border-l-4', levelStyles.band)}>
              <div className="py-6 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-neutral-200 mb-2">
                  Ready for SKU Planning
                </h4>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4 max-w-[280px] mx-auto">
                  This category has {formatBudgetCurrency(node.budget)} allocated. Create an SKU proposal to plan specific products.
                </p>
                <Link
                  href={`/sku-proposal?category=${node.id}&budget=${node.budget}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Create SKU Proposal
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content - Budget Breakdown */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className={cn('px-4 pb-4 border-t border-slate-100 dark:border-neutral-800 border-l-4', levelStyles.band)}>
              {/* Visual Chart Section */}
              <div className="py-5 border-b border-slate-100 dark:border-neutral-800">
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
                <h4 className="text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-semibold">
                  Budget Allocation
                </h4>
                <span className="text-xs text-slate-400 dark:text-neutral-500">
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
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-neutral-400">Total Allocated</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                      {formatBudgetCurrency(allocated)}
                    </span>
                    <div className={cn(
                      'px-2 py-1 rounded-xl text-xs font-semibold',
                      healthStyles.bg,
                      healthStyles.text
                    )}>
                      {isOverBudget ? 'Over budget' : `${formatBudgetCurrency(remaining)} available`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExpandableCard;
