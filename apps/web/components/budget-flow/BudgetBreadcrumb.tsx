'use client';

import { cn } from '@/lib/utils';
import { BudgetNode } from './types';
import { ChevronRight, Home } from 'lucide-react';

interface BudgetBreadcrumbProps {
  path: BudgetNode[];
  onNavigate: (node: BudgetNode | null) => void;
  className?: string;
}

export function BudgetBreadcrumb({ path, onNavigate, className }: BudgetBreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <nav className={cn('flex items-center gap-1 text-sm mb-4', className)}>
      {/* Home/Root button */}
      <button
        onClick={() => onNavigate(null)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors',
          'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800'
        )}
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Root</span>
      </button>

      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        return (
          <div key={node.id} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-neutral-600 mx-1" />
            {isLast ? (
              <span className="px-2 py-1 font-medium text-slate-900 dark:text-neutral-100">
                {node.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(node)}
                className={cn(
                  'px-2 py-1 rounded-lg transition-colors',
                  'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800'
                )}
              >
                {node.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default BudgetBreadcrumb;
