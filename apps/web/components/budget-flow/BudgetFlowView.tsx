'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BudgetNode, ProductData, SizeData } from './types';
import { BudgetOverviewHeader } from './BudgetOverviewHeader';
import { BudgetBreadcrumb } from './BudgetBreadcrumb';
import { BudgetFilters, useBudgetFilters, filterBudgetNodes } from './BudgetFilters';
import { StackedCard } from './StackedCard';
import { ExpandableCard } from './ExpandableCard';
import { GapCopilot } from './gap-handling';
import { VersionHistoryPanel } from './version-history';
import { useStackedCards } from './hooks/useStackedCards';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { formatCurrency } from './utils/budget-calculations';
import { getHierarchyColor } from './utils/hierarchy-colors';
import { Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Gap Copilot state
  const [isGapCopilotOpen, setIsGapCopilotOpen] = useState(false);

  // Version History state
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

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

  // Handle node selection from Gap Copilot
  const handleNodeSelectFromCopilot = useCallback((nodeId: string) => {
    const node = findNodeById(data, nodeId);
    if (node) {
      // Find the parent path and set focus
      const path = getPathToNode(data, nodeId);
      if (path.length > 1) {
        // Set focus to the parent of the selected node
        setFocusedNodeId(path[path.length - 2].id);
      }
      // Expand the node
      toggleCard(nodeId);
    }
  }, [data, toggleCard]);

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

      {/* Floating Action Buttons */}
      <div className={cn(
        'fixed bottom-6 right-6 flex flex-col gap-3',
        (isGapCopilotOpen || isVersionHistoryOpen) && 'hidden'
      )}>
        {/* Version History Button */}
        <Button
          onClick={() => setIsVersionHistoryOpen(true)}
          className={cn(
            'h-12 w-12 rounded-full shadow-lg',
            'bg-slate-700 hover:bg-slate-800',
            'flex items-center justify-center transition-all hover:scale-110'
          )}
        >
          <History className="h-5 w-5 text-white" />
        </Button>

        {/* Gap Copilot Button */}
        <Button
          onClick={() => setIsGapCopilotOpen(true)}
          className={cn(
            'h-14 w-14 rounded-full shadow-xl',
            'bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600',
            'flex items-center justify-center transition-all hover:scale-110'
          )}
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Gap Copilot Panel */}
      <GapCopilot
        data={data}
        isOpen={isGapCopilotOpen}
        onClose={() => setIsGapCopilotOpen(false)}
        onBudgetUpdate={onBudgetUpdate}
        onNodeSelect={handleNodeSelectFromCopilot}
      />

      {/* Version History Panel */}
      <VersionHistoryPanel
        data={data}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
      />
    </div>
  );
}

export default BudgetFlowView;
