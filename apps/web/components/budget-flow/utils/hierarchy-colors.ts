import { HierarchyLevel } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// NEUTRAL LUXURY PALETTE - Apple-inspired, Premium Design Language
// ═══════════════════════════════════════════════════════════════════════════════

export const HIERARCHY_COLORS: Record<HierarchyLevel, {
  bg: string;
  border: string;
  tab: string;
  tabHover: string;
  text: string;
  textMuted: string;
  shadow: string;
  indent: number;
}> = {
  0: {
    // Root level - Dark header
    bg: 'bg-slate-900',
    border: 'border-slate-800',
    tab: 'bg-slate-900',
    tabHover: 'hover:bg-slate-800',
    text: 'text-white',
    textMuted: 'text-slate-300',
    shadow: 'shadow-xl',
    indent: 0,
  },
  1: {
    // Collection level - White card with strong shadow
    bg: 'bg-white',
    border: 'border-slate-200',
    tab: 'bg-white',
    tabHover: 'hover:bg-slate-50',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    shadow: 'shadow-lg',
    indent: 0,
  },
  2: {
    // Gender level - Subtle gray
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    tab: 'bg-slate-50',
    tabHover: 'hover:bg-slate-100',
    text: 'text-slate-800',
    textMuted: 'text-slate-500',
    shadow: 'shadow-md',
    indent: 16,
  },
  3: {
    // Category level - White nested
    bg: 'bg-white',
    border: 'border-slate-100',
    tab: 'bg-white',
    tabHover: 'hover:bg-slate-50',
    text: 'text-slate-700',
    textMuted: 'text-slate-400',
    shadow: 'shadow-sm',
    indent: 16,
  },
  4: {
    // Product level - Lightest gray
    bg: 'bg-slate-50/50',
    border: 'border-slate-100',
    tab: 'bg-slate-50/50',
    tabHover: 'hover:bg-slate-100/50',
    text: 'text-slate-600',
    textMuted: 'text-slate-400',
    shadow: 'shadow-sm',
    indent: 16,
  },
  5: {
    // SKU level - Minimal
    bg: 'bg-white',
    border: 'border-slate-100',
    tab: 'bg-white',
    tabHover: 'hover:bg-slate-50',
    text: 'text-slate-600',
    textMuted: 'text-slate-400',
    shadow: '',
    indent: 16,
  },
};

// Status colors - Subtle, professional
export const STATUS_COLORS: Record<string, {
  badge: string;
  border: string;
  dot: string;
}> = {
  draft: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  verified: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  error: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  locked: {
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
};

// Level names for display
export const LEVEL_CONFIG: Record<HierarchyLevel, {
  name: string;
  iconName: string;
}> = {
  0: { name: 'Total Budget', iconName: 'Wallet' },
  1: { name: 'Collection', iconName: 'Tag' },
  2: { name: 'Gender', iconName: 'Users' },
  3: { name: 'Category', iconName: 'Package' },
  4: { name: 'Product', iconName: 'ShoppingBag' },
  5: { name: 'SKU/Size', iconName: 'Ruler' },
};

export const getHierarchyColor = (level: HierarchyLevel) => {
  return HIERARCHY_COLORS[level] || HIERARCHY_COLORS[5];
};

export const getStatusColor = (status: string) => {
  return STATUS_COLORS[status] || STATUS_COLORS.draft;
};

export const getLevelName = (level: HierarchyLevel): string => {
  return LEVEL_CONFIG[level]?.name || 'Item';
};

export const getLevelIcon = (level: HierarchyLevel): string => {
  return LEVEL_CONFIG[level]?.iconName || 'Circle';
};
