'use client';

import { cn } from '@/lib/utils';
import { StackedCardProps, BudgetNode, ProductData, SizeData } from './types';
import { getHierarchyColor } from './utils/hierarchy-colors';
import { CardTab } from './CardTab';
import { CardContent } from './CardContent';

export function StackedCard({
  node,
  isExpanded,
  onToggle,
  onNodeUpdate,
  onProductUpdate,
  onSizeUpdate,
  depth = 0,
  siblingIndex = 0,
  totalSiblings = 1,
  expandedIds,
}: StackedCardProps & { expandedIds?: Set<string> }) {
  const colors = getHierarchyColor(node.level);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      className="transition-all duration-200"
      style={{ marginLeft: `${colors.indent}px` }}
      data-card-id={node.id}
      data-level={node.level}
    >
      {/* Tab Row */}
      <CardTab
        node={node}
        onClick={() => onToggle(node.id)}
        isExpanded={isExpanded}
      />

      {/* Expanded Content */}
      {isExpanded && (
        <div className="pl-4 ml-3 border-l-2 border-slate-100">
          <CardContent node={node}>
            {hasChildren && (
              <StackedCardContainer
                nodes={node.children!}
                parentExpanded={isExpanded}
                onToggle={onToggle}
                onNodeUpdate={onNodeUpdate}
                onProductUpdate={onProductUpdate}
                onSizeUpdate={onSizeUpdate}
                expandedIds={expandedIds}
                depth={depth + 1}
              />
            )}
          </CardContent>
        </div>
      )}
    </div>
  );
}

interface StackedCardContainerProps {
  nodes: BudgetNode[];
  parentExpanded: boolean;
  onToggle: (id: string) => void;
  onNodeUpdate?: (id: string, data: Partial<BudgetNode>) => void;
  onProductUpdate?: (productId: string, data: Partial<ProductData>) => void;
  onSizeUpdate?: (productId: string, sizeIndex: number, field: keyof SizeData, value: number) => void;
  expandedIds?: Set<string>;
  depth?: number;
}

export function StackedCardContainer({
  nodes,
  parentExpanded,
  onToggle,
  onNodeUpdate,
  onProductUpdate,
  onSizeUpdate,
  expandedIds = new Set(),
  depth = 0,
}: StackedCardContainerProps) {
  if (!parentExpanded || nodes.length === 0) return null;

  return (
    <div>
      {nodes.map((node) => (
        <StackedCard
          key={node.id}
          node={node}
          isExpanded={expandedIds.has(node.id)}
          onToggle={onToggle}
          onNodeUpdate={onNodeUpdate}
          onProductUpdate={onProductUpdate}
          onSizeUpdate={onSizeUpdate}
          expandedIds={expandedIds}
          depth={depth}
        />
      ))}
    </div>
  );
}

export default StackedCard;
