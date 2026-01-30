'use client';

import { cn } from '@/lib/utils';
import { StackedCardProps, BudgetNode, ProductData, SizeData } from './types';
import { getHierarchyColor, getStatusColor } from './utils/hierarchy-colors';
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
  const statusColors = getStatusColor(node.status);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        'transition-all duration-300 ease-out',
        'border',
        colors.border,
        colors.shadow,
        colors.bg,
        // Stacking effect when collapsed
        !isExpanded && siblingIndex > 0 && '-mt-12',
      )}
      style={{
        zIndex: totalSiblings - siblingIndex,
        marginLeft: `${colors.indent}px`,
      }}
      data-card-id={node.id}
      data-level={node.level}
    >
      {/* Card Header/Tab */}
      <CardTab
        node={node}
        onClick={() => onToggle(node.id)}
        isExpanded={isExpanded}
        depth={0}
      />

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <CardContent
            node={node}
            onProductUpdate={onProductUpdate}
            onSizeUpdate={onSizeUpdate}
          >
            {/* Render Children as Stacked Cards */}
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

// Container for managing multiple stacked cards
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
    <div className="space-y-3 pt-2">
      {nodes.map((node, index) => (
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
          siblingIndex={index}
          totalSiblings={nodes.length}
        />
      ))}
    </div>
  );
}

export default StackedCard;
