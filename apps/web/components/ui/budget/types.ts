import { LucideIcon } from 'lucide-react';

export type BudgetLevel = 1 | 2 | 3 | 4 | 5;

export type BudgetHealthStatus = 'healthy' | 'warning' | 'over';

export type BudgetCardStatus = 'draft' | 'verified' | 'warning' | 'error' | 'locked';

export interface BudgetCardData {
  id: string;
  name: string;
  icon?: LucideIcon;
  level: BudgetLevel;
  budget: number;
  allocated: number;
  percentage: number;
  status: BudgetCardStatus;
  children?: BudgetCardData[];
}

export interface UnifiedBudgetCardProps {
  data: BudgetCardData;
  isExpanded?: boolean;
  isExpandable?: boolean;
  onToggle?: (id: string) => void;
  onSelect?: (id: string) => void;
  children?: React.ReactNode;
}
