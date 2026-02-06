'use client';

import { useState, useCallback } from 'react';
import { BudgetNode, BudgetFlowState } from '../types';
import { getAllNodeIds } from '../utils/budget-calculations';

export function useStackedCards(rootNode: BudgetNode | null) {
  const [state, setState] = useState<BudgetFlowState>({
    expandedIds: new Set<string>(),
    selectedId: null,
    viewMode: 'stacked',
  });

  const expandCard = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      expandedIds: new Set([...Array.from(prev.expandedIds), id]),
    }));
  }, []);

  const collapseCard = useCallback((id: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedIds);
      newExpanded.delete(id);
      return { ...prev, expandedIds: newExpanded };
    });
  }, []);

  const toggleCard = useCallback((id: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { ...prev, expandedIds: newExpanded };
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!rootNode) return;
    const allIds = getAllNodeIds(rootNode);
    setState(prev => ({
      ...prev,
      expandedIds: new Set(allIds),
    }));
  }, [rootNode]);

  const collapseAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      expandedIds: new Set(),
    }));
  }, []);

  const selectCard = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);

  const setViewMode = useCallback((mode: 'stacked' | 'grid') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const isExpanded = useCallback((id: string) => {
    return state.expandedIds.has(id);
  }, [state.expandedIds]);

  const isSelected = useCallback((id: string) => {
    return state.selectedId === id;
  }, [state.selectedId]);

  return {
    state,
    expandCard,
    collapseCard,
    toggleCard,
    expandAll,
    collapseAll,
    selectCard,
    setViewMode,
    isExpanded,
    isSelected,
  };
}

export default useStackedCards;
