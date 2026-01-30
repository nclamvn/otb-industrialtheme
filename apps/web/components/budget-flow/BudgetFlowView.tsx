'use client';

import { cn } from '@/lib/utils';
import { BudgetNode, ProductData, SizeData } from './types';
import { BudgetOverviewHeader } from './BudgetOverviewHeader';
import { StackedCard } from './StackedCard';
import { useStackedCards } from './hooks/useStackedCards';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { formatCurrency } from './utils/budget-calculations';
import { getHierarchyColor } from './utils/hierarchy-colors';

interface BudgetFlowViewProps {
  data: BudgetNode;
  onNodeUpdate?: (id: string, data: Partial<BudgetNode>) => void;
  onProductUpdate?: (productId: string, data: Partial<ProductData>) => void;
  onSizeUpdate?: (productId: string, sizeIndex: number, field: keyof SizeData, value: number) => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

export function BudgetFlowView({
  data,
  onNodeUpdate,
  onProductUpdate,
  onSizeUpdate,
  onExport,
  onRefresh,
}: BudgetFlowViewProps) {
  const {
    state,
    toggleCard,
    expandAll,
    collapseAll,
    selectCard,
    setViewMode,
    isExpanded,
  } = useStackedCards(data);

  useKeyboardNavigation({
    rootNode: data,
    selectedId: state.selectedId,
    expandedIds: state.expandedIds,
    onSelect: selectCard,
    onToggle: toggleCard,
    onExpandAll: expandAll,
    onCollapseAll: collapseAll,
  });

  // Render List View (flat rows)
  const renderListView = () => {
    if (!data.children) return null;

    return (
      <div className="space-y-1">
        {data.children.map((child) => (
          <StackedCard
            key={child.id}
            node={child}
            isExpanded={isExpanded(child.id)}
            onToggle={toggleCard}
            onNodeUpdate={onNodeUpdate}
            onProductUpdate={onProductUpdate}
            onSizeUpdate={onSizeUpdate}
            expandedIds={state.expandedIds}
            depth={0}
          />
        ))}
      </div>
    );
  };

  // Render Grid View
  const renderGridView = () => {
    if (!data.children) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.children.map((child) => {
          const colors = getHierarchyColor(child.level);
          return (
            <button
              key={child.id}
              onClick={() => toggleCard(child.id)}
              className="text-left p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-1 h-8 rounded-full', colors.accent)} />
                <span className="font-medium text-slate-800">{child.name}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(child.budget)}
              </div>
              <div className="text-sm text-slate-500">
                {(child.percentage * 100).toFixed(1)}% of total
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6">
      <BudgetOverviewHeader
        rootNode={data}
        viewMode={state.viewMode}
        onViewModeChange={setViewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onExport={onExport}
        onRefresh={onRefresh}
      />

      <div>
        {state.viewMode === 'stacked' ? renderListView() : renderGridView()}
      </div>

      {/* Keyboard hints - minimal */}
      <div className="mt-6 text-xs text-slate-400 flex gap-4">
        <span>↑↓ Navigate</span>
        <span>←→ Collapse/Expand</span>
        <span>⌘E Expand all</span>
        <span>⌘W Collapse all</span>
      </div>
    </div>
  );
}

export default BudgetFlowView;
