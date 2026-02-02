'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Pencil, Check, X, Wand2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BudgetCardData, BudgetLevel, BudgetCardStatus } from './types';
import { getLevelStyles, getBudgetHealth, getHealthStyles, formatBudgetCurrency, formatBudgetPercentage } from './budget-utils';
import { BudgetProgressBar } from './BudgetProgressBar';
import { BudgetStatusBadge } from './BudgetStatusBadge';

interface BudgetFlowCardProps {
  data: BudgetCardData;
  isExpanded?: boolean;
  onToggle?: (id: string) => void;
  onSelect?: (id: string) => void;
  onBudgetUpdate?: (nodeId: string, newBudget: number) => void;
  onDrillDown?: (data: BudgetCardData) => void;
  showEditButton?: boolean;
  showDrillDown?: boolean;
  children?: React.ReactNode;
}

// Inline Editable Budget Input Component
function EditableBudget({
  value,
  onSave,
  onCancel,
}: {
  value: number;
  onSave: (newValue: number) => void;
  onCancel: () => void;
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
            'pl-7 pr-3 py-1.5 w-32 rounded-lg',
            'border-2 border-amber-300 dark:border-amber-700 bg-card',
            'text-lg font-bold tabular-nums text-slate-900 dark:text-neutral-100',
            'focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
          )}
        />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleSave(); }}
        className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="p-1.5 rounded-lg bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-neutral-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function BudgetFlowCard({
  data,
  isExpanded = false,
  onToggle,
  onSelect,
  onBudgetUpdate,
  onDrillDown,
  showEditButton = true,
  showDrillDown = true,
  children,
}: BudgetFlowCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { id, name, icon: Icon, level, budget, allocated, percentage, status } = data;
  const levelStyles = getLevelStyles(level);
  const health = getBudgetHealth(budget > 0 ? allocated / budget : 0);
  const healthStyles = getHealthStyles(health);
  const hasChildren = !!children || (data.children && data.children.length > 0);
  const remaining = budget - allocated;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle && !isEditing) {
      onToggle(id);
    }
  };

  const handleDrillDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDrillDown && hasChildren) {
      onDrillDown(data);
    }
  };

  const handleBudgetSave = (newValue: number) => {
    onBudgetUpdate?.(id, newValue);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-200',
        'hover:border-border/80',
        'bg-card',
        isExpanded && 'ring-2 ring-amber-200 dark:ring-amber-800 border-amber-300 dark:border-amber-700'
      )}
      style={{ marginLeft: level > 1 ? `${(level - 1) * 24}px` : 0 }}
    >
      {/* Watermark Icon - Large, faded into background */}
      {Icon && !isEditing && (
        <div className="absolute -right-4 -bottom-4 pointer-events-none">
          <Icon className="w-20 h-20 text-muted-foreground opacity-[0.06]" />
        </div>
      )}

      {/* Card Header */}
      <div
        className={cn(
          'flex items-center justify-between p-3',
          'border-l-4',
          levelStyles.band,
          !isEditing && 'cursor-pointer'
        )}
        onClick={handleToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        {/* Left: Name + Status */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">{name}</span>
              <BudgetStatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Right: Budget + Actions */}
        <div className="flex items-center gap-3 pr-12">
          {/* Budget Amount - Editable */}
          {isEditing ? (
            <EditableBudget
              value={budget}
              onSave={handleBudgetSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="text-right">
              <div className="font-semibold text-foreground tabular-nums">
                {formatBudgetCurrency(budget)}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {formatBudgetPercentage(percentage)}
              </div>
            </div>
          )}

          {/* Edit Button */}
          {showEditButton && !isEditing && onBudgetUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-all opacity-0 group-hover:opacity-100"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {/* Expand/Collapse Chevron */}
          {hasChildren && (
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

              {/* Children or SKU Proposal Link */}
              {children ? (
                <div className="space-y-2 mt-3">
                  {children}
                </div>
              ) : !hasChildren ? (
                /* No children - show SKU Proposal link */
                <div className="py-4 text-center border-t border-border mt-3">
                  <div className="mb-3">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    Ready for SKU Planning
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3 max-w-[250px] mx-auto">
                    {formatBudgetCurrency(budget)} allocated. Create an SKU proposal.
                  </p>
                  <Link
                    href={`/sku-proposal?category=${id}&budget=${budget}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                    Create SKU Proposal
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </Link>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BudgetFlowCard;
