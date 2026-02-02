'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NavigationState {
  season?: { id: string; code: string; name: string };
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
  sku?: { id: string; code: string; name: string };
}

interface NavigationHistory {
  path: string;
  label: string;
  timestamp: number;
}

interface NavigationContextValue {
  state: NavigationState;
  history: NavigationHistory[];
  setSeason: (season: NavigationState['season']) => void;
  setBrand: (brand: NavigationState['brand']) => void;
  setCategory: (category: NavigationState['category']) => void;
  setSKU: (sku: NavigationState['sku']) => void;
  clearState: () => void;
  addToHistory: (path: string, label: string) => void;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const STORAGE_KEY = 'dafc-navigation-state';
const HISTORY_KEY = 'dafc-navigation-history';
const MAX_HISTORY = 10;

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavigationState>({});
  const [history, setHistory] = useState<NavigationHistory[]>([]);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        setState(JSON.parse(savedState));
      }
      const savedHistory = sessionStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load navigation state:', error);
    }
  }, []);

  // Save to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }, [state]);

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save navigation history:', error);
    }
  }, [history]);

  const setSeason = useCallback((season: NavigationState['season']) => {
    setState((prev) => ({ ...prev, season }));
  }, []);

  const setBrand = useCallback((brand: NavigationState['brand']) => {
    setState((prev) => ({ ...prev, brand }));
  }, []);

  const setCategory = useCallback((category: NavigationState['category']) => {
    setState((prev) => ({ ...prev, category }));
  }, []);

  const setSKU = useCallback((sku: NavigationState['sku']) => {
    setState((prev) => ({ ...prev, sku }));
  }, []);

  const clearState = useCallback(() => {
    setState({});
  }, []);

  const addToHistory = useCallback((path: string, label: string) => {
    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((h) => h.path !== path);
      // Add new entry at the beginning
      const newHistory = [
        { path, label, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        state,
        history,
        setSeason,
        setBrand,
        setCategory,
        setSKU,
        clearState,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Hook for tracking page visits
export function usePageTracking(path: string, label: string) {
  const { addToHistory } = useNavigation();

  useEffect(() => {
    addToHistory(path, label);
  }, [path, label, addToHistory]);
}
