'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode, ProductData, SizeData } from './types';
import { BudgetOverviewHeader } from './BudgetOverviewHeader';
import { BudgetBreadcrumb } from './BudgetBreadcrumb';
import { BudgetFilters, useBudgetFilters, filterBudgetNodes } from './BudgetFilters';
import { StackedCard } from './StackedCard';
import { ExpandableCard } from './ExpandableCard';
import { useStackedCards } from './hooks/useStackedCards';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { formatCurrency } from './utils/budget-calculations';
import { getHierarchyColor } from './utils/hierarchy-colors';

interface BudgetFlowViewProps {
  data: BudgetNode;
  onNodeUpdate?: (id: string, data: Partial<BudgetNode>) => void;
  onBudgetUpdate?: (nodeId: string, newBudget: number) => void;
  onProductUpdate?: (productId: string, data: Partial<ProductData>) => void;
  onSizeUpdate?: (productId: string, sizeIndex: number, field: keyof SizeData, value: number) => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

// Helper function to find a node by ID in the tree
function findNodeById(root: BudgetNode, id: string): BudgetNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to get the path from root to a node
function getPathToNode(root: BudgetNode, targetId: string): BudgetNode[] {
  const path: BudgetNode[] = [];

  function traverse(node: BudgetNode): boolean {
    if (node.id === targetId) {
      path.push(node);
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (traverse(child)) {
          path.unshift(node);
          return true;
        }
      }
    }
    return false;
  }

  traverse(root);
  return path;
}

export function BudgetFlowView({
  data,
  onNodeUpdate,
  onBudgetUpdate,
  onProductUpdate,
  onSizeUpdate,
  onExport,
  onRefresh,
}: BudgetFlowViewProps) {
  // Drill-down state - which node is currently focused
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Filter state
  const { filters, setFilters } = useBudgetFilters();

  const {
    state,
    toggleCard,
    expandAll,
    collapseAll,
    selectCard,
    setViewMode,
    isExpanded,
  } = useStackedCards(data);

  // Get the currently focused node and its path
  const focusedNode = useMemo(() => {
    if (!focusedNodeId) return null;
    return findNodeById(data, focusedNodeId);
  }, [data, focusedNodeId]);

  const breadcrumbPath = useMemo(() => {
    if (!focusedNodeId) return [];
    return getPathToNode(data, focusedNodeId);
  }, [data, focusedNodeId]);

  // The node to display (either focused or root)
  const displayNode = focusedNode || data;

  // Apply filters to the children
  const filteredChildren = useMemo(() => {
    if (!displayNode.children) return [];
    return filterBudgetNodes(displayNode.children, filters);
  }, [displayNode.children, filters]);

  useKeyboardNavigation({
    rootNode: displayNode,
    selectedId: state.selectedId,
    expandedIds: state.expandedIds,
    onSelect: selectCard,
    onToggle: toggleCard,
    onExpandAll: expandAll,
    onCollapseAll: collapseAll,
  });

  // Handle drill-down navigation
  const handleDrillDown = useCallback((node: BudgetNode) => {
    if (node.children && node.children.length > 0) {
      setFocusedNodeId(node.id);
    }
  }, []);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((node: BudgetNode | null) => {
    setFocusedNodeId(node?.id || null);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (breadcrumbPath.length > 1) {
      // Go to parent
      setFocusedNodeId(breadcrumbPath[breadcrumbPath.length - 2].id);
    } else {
      // Go to root
      setFocusedNodeId(null);
    }
  }, [breadcrumbPath]);

  // Render List View (flat rows)
  const renderListView = () => {
    if (filteredChildren.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <p>No items match your filters</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {filteredChildren.map((child) => (
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

  // Render Grid View - Premium Expandable Cards
  const renderGridView = () => {
    if (filteredChildren.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <p>No items match your filters</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChildren.map((child) => (
          <ExpandableCard
            key={child.id}
            node={child}
            onDrillDown={handleDrillDown}
            onBudgetUpdate={onBudgetUpdate}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Breadcrumb Navigation */}
      {focusedNodeId && (
        <BudgetBreadcrumb
          path={breadcrumbPath}
          onNavigate={handleBreadcrumbNavigate}
        />
      )}

      <BudgetOverviewHeader
        rootNode={displayNode}
        viewMode={state.viewMode}
        onViewModeChange={setViewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onExport={onExport}
        onRefresh={onRefresh}
        onBack={focusedNodeId ? handleBack : undefined}
      />

      {/* Filters */}
      <BudgetFilters
        filters={filters}
        onFiltersChange={setFilters}
        className="mb-6"
      />

      {/* Results count */}
      {displayNode.children && (
        <div className="text-sm text-slate-500 mb-4">
          Showing {filteredChildren.length} of {displayNode.children.length} items
        </div>
      )}

      <div>
        {state.viewMode === 'stacked' ? renderListView() : renderGridView()}
      </div>

      {/* Keyboard hints - minimal */}
      <div className="mt-6 text-xs text-slate-400 flex gap-4">
        <span>↑↓ Navigate</span>
        <span>←→ Collapse/Expand</span>
        <span>⌘E Expand all</span>
        <span>⌘W Collapse all</span>
        {focusedNodeId && <span>⌫ Back</span>}
      </div>
    </div>
  );
}

export default BudgetFlowView;
