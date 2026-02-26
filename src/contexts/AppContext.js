'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Dark mode removed — light theme only
  const [darkMode] = useState(false);
  const setDarkMode = useCallback(() => {}, []);

  // Shared filter state between Budget Management and Planning screens
  const [sharedYear, setSharedYear] = useState(2025);
  const [sharedGroupBrand, setSharedGroupBrand] = useState(null);
  const [sharedBrand, setSharedBrand] = useState(null);

  // Cross-screen data passing
  const [allocationData, setAllocationData] = useState(null);
  const [otbAnalysisContext, setOtbAnalysisContext] = useState(null);
  const [skuProposalContext, setSkuProposalContext] = useState(null);

  // Save handler system — screens register their save function here
  const saveHandlerRef = useRef(null);
  const [hasSaveHandler, setHasSaveHandler] = useState(false);

  const registerSave = useCallback((handler) => {
    saveHandlerRef.current = handler;
    setHasSaveHandler(true);
  }, []);

  const unregisterSave = useCallback(() => {
    saveHandlerRef.current = null;
    setHasSaveHandler(false);
  }, []);

  const triggerSave = useCallback(async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  }, []);

  // KPI data for header step bar
  const [kpiData, setKpiData] = useState({
    'budget-management': { value: 5, status: 'completed' },
    'planning': { value: 3, status: 'in-progress' },
    'otb-analysis': { value: 0, status: 'pending' },
    'proposal': { value: 0, status: 'pending' },
    'tickets': { value: 4, status: 'in-progress' },
  });

  const value = {
    darkMode,
    setDarkMode,
    sharedYear,
    setSharedYear,
    sharedGroupBrand,
    setSharedGroupBrand,
    sharedBrand,
    setSharedBrand,
    allocationData,
    setAllocationData,
    otbAnalysisContext,
    setOtbAnalysisContext,
    skuProposalContext,
    setSkuProposalContext,
    kpiData,
    setKpiData,
    registerSave,
    unregisterSave,
    triggerSave,
    hasSaveHandler,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
