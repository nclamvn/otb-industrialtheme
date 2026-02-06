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
        'relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-200',
        'hover:border-border/80',
        'bg-card',
      )}
      style={{ marginLeft: level > 1 ? `${(level - 1) * 24}px` : 0 }}
    >
      {/* Watermark Icon - Large, faded into background */}
      {Icon && (
        <div className="absolute -right-4 -bottom-4 pointer-events-none">
          <Icon className="w-20 h-20 text-muted-foreground opacity-[0.06]" />
        </div>
      )}

      {/* Card Header */}
      <div
        className={cn(
          'flex items-center justify-between p-3 cursor-pointer',
          'border-l-4',
          levelStyles.band,
        )}
        onClick={handleToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        {/* Left: Name + Status */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">{name}</span>
              <BudgetStatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Right: Budget + Percentage + Chevron */}
        <div className="flex items-center gap-3 pr-12">
          <div className="text-right">
            <div className="font-semibold text-foreground tabular-nums">
              {formatBudgetCurrency(budget)}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {formatBudgetPercentage(percentage)}
            </div>
          </div>

          {isExpandable && hasChildren && (
            <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
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
            <div className={cn('px-3 pb-3 border-l-4', levelStyles.band)}>
              {/* Progress Bar */}
              <BudgetProgressBar
                budget={budget}
                allocated={allocated}
                className="mb-3"
              />

              {/* Children */}
              {children && (
                <div className="space-y-2 mt-3">
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
