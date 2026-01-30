'use client';

import { useEffect, useCallback } from 'react';
import { BudgetNode } from '../types';

interface UseKeyboardNavigationProps {
  rootNode: BudgetNode | null;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function useKeyboardNavigation({
  rootNode,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  onExpandAll,
  onCollapseAll,
}: UseKeyboardNavigationProps) {

  const getVisibleIds = useCallback((): string[] => {
    if (!rootNode) return [];

    const visible: string[] = [];

    const traverse = (node: BudgetNode) => {
      visible.push(node.id);
      if (expandedIds.has(node.id) && node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(rootNode);
    return visible;
  }, [rootNode, expandedIds]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const visibleIds = getVisibleIds();
    const currentIndex = selectedId ? visibleIds.indexOf(selectedId) : -1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < visibleIds.length - 1) {
          onSelect(visibleIds[currentIndex + 1]);
        } else if (currentIndex === -1 && visibleIds.length > 0) {
          onSelect(visibleIds[0]);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          onSelect(visibleIds[currentIndex - 1]);
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (selectedId && !expandedIds.has(selectedId)) {
          onToggle(selectedId);
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (selectedId && expandedIds.has(selectedId)) {
          onToggle(selectedId);
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (selectedId) {
          onToggle(selectedId);
        }
        break;

      case 'Home':
        event.preventDefault();
        if (visibleIds.length > 0) {
          onSelect(visibleIds[0]);
        }
        break;

      case 'End':
        event.preventDefault();
        if (visibleIds.length > 0) {
          onSelect(visibleIds[visibleIds.length - 1]);
        }
        break;

      case 'e':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onExpandAll();
        }
        break;

      case 'w':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onCollapseAll();
        }
        break;

      case 'Escape':
        event.preventDefault();
        onSelect(null);
        break;
    }
  }, [getVisibleIds, selectedId, expandedIds, onSelect, onToggle, onExpandAll, onCollapseAll]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { getVisibleIds };
}

export default useKeyboardNavigation;
