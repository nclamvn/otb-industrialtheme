export type HierarchyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type CardStatus = 'draft' | 'verified' | 'warning' | 'error' | 'locked';

export interface SizeData {
  size: string;
  salesMixPercent: number;
  sellThruPercent: number;
  units: number;
  value: number;
}

export interface ProductData {
  id: string;
  styleCode: string;
  name: string;
  unitPrice: number;
  totalQty: number;
  totalValue: number;
  sizes: SizeData[];
  status: CardStatus;
  aiSuggestion?: string;
}

export interface BudgetNode {
  id: string;
  name: string;
  icon?: string;
  level: HierarchyLevel;
  budget: number;
  allocated: number;
  percentage: number;
  status: CardStatus;
  children?: BudgetNode[];
  products?: ProductData[];
  metadata?: {
    collection?: string;
    gender?: string;
    category?: string;
    seasonYear?: string;
    brand?: string;
    location?: string;
  };
}

export interface StackedCardProps {
  node: BudgetNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onNodeUpdate?: (id: string, data: Partial<BudgetNode>) => void;
  onProductUpdate?: (productId: string, data: Partial<ProductData>) => void;
  onSizeUpdate?: (productId: string, sizeIndex: number, field: keyof SizeData, value: number) => void;
  depth?: number;
  siblingIndex?: number;
  totalSiblings?: number;
}

export interface CardTabProps {
  node: BudgetNode;
  onClick: () => void;
  isLast?: boolean;
  depth?: number;
}

export interface BudgetFlowState {
  expandedIds: Set<string>;
  selectedId: string | null;
  viewMode: 'stacked' | 'grid';
}

export interface BudgetFlowContextType {
  state: BudgetFlowState;
  expandCard: (id: string) => void;
  collapseCard: (id: string) => void;
  toggleCard: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  selectCard: (id: string | null) => void;
  setViewMode: (mode: 'stacked' | 'grid') => void;
}
