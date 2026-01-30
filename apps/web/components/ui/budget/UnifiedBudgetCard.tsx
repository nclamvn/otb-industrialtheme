'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedBudgetCardProps } from './types';
import { getLevelStyles, formatBudgetCurrency, formatBudgetPercentage } from './budget-utils';
import { BudgetProgressBar } from './BudgetProgressBar';
import { BudgetStatusBadge } from './BudgetStatusBadge';

export function UnifiedBudgetCard({
  data,
  isExpanded = false,
  isExpandable = true,
  onToggle,
  onSelect,
  children,
}: UnifiedBudgetCardProps) {
  const { id, name, icon: Icon, level, budget, allocated, percentage, status } = data;
  const levelStyles = getLevelStyles(level);
  const hasChildren = !!children;

  const handleToggle = () => {
    if (isExpandable && onToggle) {
      onToggle(id);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(id);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden transition-all duration-200',
        'hover:shadow-md shadow-sm',
        levelStyles.bg,
      )}
      style={{ marginLeft: level > 1 ? `${(level - 1) * 24}px` : 0 }}
    >
      {/* Card Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 cursor-pointer',
          'border-l-4',
          levelStyles.band,
        )}
        onClick={handleToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        {/* Left: Icon + Name + Status */}
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-slate-600 dark:text-neutral-300" />}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-neutral-100">{name}</span>
              <BudgetStatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Right: Budget + Percentage + Chevron */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-semibold text-slate-900 dark:text-neutral-100">
              {formatBudgetCurrency(budget)}
            </div>
            <div className="text-sm text-slate-500 dark:text-neutral-400">
              {formatBudgetPercentage(percentage)}
            </div>
          </div>

          {isExpandable && hasChildren && (
            <div className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-neutral-500">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className={cn('px-4 pb-4 border-l-4', levelStyles.band)}>
              {/* Progress Bar */}
              <BudgetProgressBar
                budget={budget}
                allocated={allocated}
                className="mb-4"
              />

              {/* Children */}
              {children && (
                <div className="space-y-2 mt-4">
                  {children}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
