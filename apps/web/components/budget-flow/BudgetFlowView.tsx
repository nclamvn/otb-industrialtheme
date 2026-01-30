'use client';

import { cn } from '@/lib/utils';
import { BudgetNode, ProductData, SizeData } from './types';
import { BudgetOverviewHeader } from './BudgetOverviewHeader';
import { StackedCard } from './StackedCard';
import { useStackedCards } from './hooks/useStackedCards';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { formatCurrency } from './utils/budget-calculations';

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

  // Render Stacked View
  const renderStackedView = () => {
    if (!data.children) return null;

    return (
      <div className="space-y-4" data-onboard="stacked-card">
        {data.children.map((child, index) => (
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
            siblingIndex={0}
            totalSiblings={1}
          />
        ))}
      </div>
    );
  };

  // Render Grid View (Fallback)
  const renderGridView = () => {
    if (!data.children) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.children.map((child) => (
          <div
            key={child.id}
            className="bg-white rounded-lg shadow-md p-4 border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => toggleCard(child.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{child.icon || '📁'}</span>
              <h3 className="font-semibold">{child.name}</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(child.budget)}
            </p>
            <p className="text-sm text-gray-500">
              {(child.percentage * 100).toFixed(1)}% of total
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <BudgetOverviewHeader
        rootNode={data}
        viewMode={state.viewMode}
        onViewModeChange={setViewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onExport={onExport}
        onRefresh={onRefresh}
      />

      {/* Main Content */}
      <div className="mt-6">
        {state.viewMode === 'stacked' ? renderStackedView() : renderGridView()}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600" data-onboard="keyboard-help">
        <p className="font-medium mb-2">Keyboard Shortcuts:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <span>↑↓ Navigate</span>
          <span>←→ Collapse/Expand</span>
          <span>Enter Toggle</span>
          <span>Ctrl+E Expand All</span>
          <span>Ctrl+W Collapse All</span>
          <span>Esc Deselect</span>
        </div>
      </div>
    </div>
  );
}

export default BudgetFlowView;
