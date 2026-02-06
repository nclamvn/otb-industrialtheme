import { HierarchyLevel } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// FLAT DESIGN WITH COLOR BANDS - No shadows, subtle left accent strips
// ═══════════════════════════════════════════════════════════════════════════════

export const HIERARCHY_COLORS: Record<HierarchyLevel, {
  bg: string;
  border: string;
  accent: string;      // Left color band
  accentWidth: string; // Width of left band
  text: string;
  textMuted: string;
  indent: number;
}> = {
  0: {
    // Root level - Dark accent
    bg: 'bg-transparent',
    border: 'border-slate-200',
    accent: 'bg-slate-800',
    accentWidth: 'w-1',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    indent: 0,
  },
  1: {
    // Collection - Blue accent
    bg: 'bg-transparent',
    border: 'border-slate-100',
    accent: 'bg-blue-500',
    accentWidth: 'w-1',
    text: 'text-slate-800',
    textMuted: 'text-slate-500',
    indent: 0,
  },
  2: {
    // Gender - Teal accent
    bg: 'bg-transparent',
    border: 'border-slate-100',
    accent: 'bg-teal-500',
    accentWidth: 'w-1',
    text: 'text-slate-700',
    textMuted: 'text-slate-400',
    indent: 24,
  },
  3: {
    // Category - Amber accent
    bg: 'bg-transparent',
    border: 'border-slate-100',
    accent: 'bg-amber-500',
    accentWidth: 'w-0.5',
    text: 'text-slate-700',
    textMuted: 'text-slate-400',
    indent: 24,
  },
  4: {
    // Product - Rose accent
    bg: 'bg-transparent',
    border: 'border-slate-50',
    accent: 'bg-rose-400',
    accentWidth: 'w-0.5',
    text: 'text-slate-600',
    textMuted: 'text-slate-400',
    indent: 24,
  },
  5: {
    // SKU - Gray accent
    bg: 'bg-transparent',
    border: 'border-slate-50',
    accent: 'bg-slate-300',
    accentWidth: 'w-0.5',
    text: 'text-slate-600',
    textMuted: 'text-slate-400',
    indent: 24,
  },
};

// Status colors - Minimal, just dots
export const STATUS_COLORS: Record<string, {
  badge: string;
  dot: string;
}> = {
  draft: {
    badge: 'text-slate-500',
    dot: 'bg-slate-400',
  },
  verified: {
    badge: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  warning: {
    badge: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  error: {
    badge: 'text-red-600',
    dot: 'bg-red-500',
  },
  locked: {
    badge: 'text-slate-400',
    dot: 'bg-slate-400',
  },
};

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
