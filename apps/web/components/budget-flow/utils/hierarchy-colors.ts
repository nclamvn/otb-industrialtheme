import { HierarchyLevel } from '../types';

export const HIERARCHY_COLORS: Record<HierarchyLevel, {
  bg: string;
  border: string;
  tab: string;
  text: string;
  icon: string;
  gradient: string;
}> = {
  0: {
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    tab: 'bg-slate-800',
    text: 'text-white',
    icon: '💰',
    gradient: 'from-slate-800 to-slate-900',
  },
  1: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    tab: 'bg-blue-600',
    text: 'text-blue-900',
    icon: '🏷️',
    gradient: 'from-blue-500 to-blue-600',
  },
  2: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    tab: 'bg-purple-600',
    text: 'text-purple-900',
    icon: '👔',
    gradient: 'from-purple-500 to-purple-600',
  },
  3: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    tab: 'bg-orange-500',
    text: 'text-orange-900',
    icon: '📦',
    gradient: 'from-orange-400 to-orange-500',
  },
  4: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    tab: 'bg-pink-500',
    text: 'text-pink-900',
    icon: '👕',
    gradient: 'from-pink-400 to-pink-500',
  },
  5: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    tab: 'bg-gray-500',
    text: 'text-gray-900',
    icon: '📏',
    gradient: 'from-gray-400 to-gray-500',
  },
};

export const STATUS_COLORS: Record<string, {
  badge: string;
  border: string;
  icon: string;
}> = {
  draft: {
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-dashed border-gray-300',
    icon: '📝',
  },
  verified: {
    badge: 'bg-green-100 text-green-700',
    border: 'border-solid border-green-400',
    icon: '✅',
  },
  warning: {
    badge: 'bg-yellow-100 text-yellow-700',
    border: 'border-solid border-yellow-400',
    icon: '⚠️',
  },
  error: {
    badge: 'bg-red-100 text-red-700',
    border: 'border-solid border-red-400',
    icon: '🔴',
  },
  locked: {
    badge: 'bg-gray-200 text-gray-500',
    border: 'border-solid border-gray-400',
    icon: '🔒',
  },
};

export const getHierarchyColor = (level: HierarchyLevel) => {
  return HIERARCHY_COLORS[level] || HIERARCHY_COLORS[5];
};

export const getStatusColor = (status: string) => {
  return STATUS_COLORS[status] || STATUS_COLORS.draft;
};

export const getLevelName = (level: HierarchyLevel): string => {
  const names: Record<HierarchyLevel, string> = {
    0: 'Total Budget',
    1: 'Collection',
    2: 'Gender',
    3: 'Category',
    4: 'Product',
    5: 'SKU/Size',
  };
  return names[level];
};
