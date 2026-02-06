'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface Season {
  id: string;
  code: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
  code?: string;
}

interface BudgetSummary {
  total: number;
  allocated: number;
  remaining: number;
}

interface PlanningContextValue {
  selectedSeason: Season | null;
  selectedBrand: Brand | null;
  budgetSummary: BudgetSummary | null;
  availableSeasons: Season[];
  availableBrands: Brand[];
  setSelectedSeason: (season: Season | null) => void;
  setSelectedBrand: (brand: Brand | null) => void;
  clearContext: () => void;
  isLoading: boolean;
}

const PlanningContext = createContext<PlanningContextValue | null>(null);

// Mock data for demo
const MOCK_SEASONS: Season[] = [
  { id: '1', code: 'SS25', name: 'Spring Summer 2025' },
  { id: '2', code: 'FW25', name: 'Fall Winter 2025' },
  { id: '3', code: 'SS26', name: 'Spring Summer 2026' },
];

const MOCK_BRANDS: Brand[] = [
  { id: '1', name: 'Ferragamo', code: 'FER' },
  { id: '2', name: 'TODs', code: 'TOD' },
  { id: '3', name: 'Burberry', code: 'BUR' },
  { id: '4', name: 'Celine', code: 'CEL' },
];

export function PlanningContextProvider({ children }: { children: React.ReactNode }) {
  const [selectedSeason, setSelectedSeasonState] = useState<Season | null>(null);
  const [selectedBrand, setSelectedBrandState] = useState<Brand | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<Season[]>(MOCK_SEASONS);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>(MOCK_BRANDS);
  const [isLoading, setIsLoading] = useState(false);

  // Persist context in sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('planning-context');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.season) setSelectedSeasonState(parsed.season);
        if (parsed.brand) setSelectedBrandState(parsed.brand);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Fetch available seasons/brands from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seasonsRes, brandsRes] = await Promise.all([
          fetch('/api/v1/seasons?isActive=true'),
          fetch('/api/v1/brands?isActive=true'),
        ]);

        if (seasonsRes.ok) {
          const seasonsData = await seasonsRes.json();
          if (seasonsData.data?.length > 0) {
            setAvailableSeasons(seasonsData.data);
          }
        }

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          if (brandsData.data?.length > 0) {
            setAvailableBrands(brandsData.data);
          }
        }
      } catch {
        // Use mock data on error
      }
    };

    fetchData();
  }, []);

  const setSelectedSeason = useCallback((season: Season | null) => {
    setSelectedSeasonState(season);
    sessionStorage.setItem('planning-context', JSON.stringify({
      season,
      brand: selectedBrand,
    }));
  }, [selectedBrand]);

  const setSelectedBrand = useCallback((brand: Brand | null) => {
    setSelectedBrandState(brand);
    sessionStorage.setItem('planning-context', JSON.stringify({
      season: selectedSeason,
      brand,
    }));
  }, [selectedSeason]);

  const clearContext = useCallback(() => {
    setSelectedSeasonState(null);
    setSelectedBrandState(null);
    setBudgetSummary(null);
    sessionStorage.removeItem('planning-context');
  }, []);

  // Fetch budget summary when context changes
  useEffect(() => {
    if (!selectedSeason || !selectedBrand) {
      setBudgetSummary(null);
      return;
    }

    const fetchBudgetSummary = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/v1/budgets/summary?seasonId=${selectedSeason.id}&brandId=${selectedBrand.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setBudgetSummary(data.data || data);
        } else {
          // Mock data for demo
          setBudgetSummary({
            total: 5200000,
            allocated: 4150000,
            remaining: 1050000,
          });
        }
      } catch {
        // Mock data for demo
        setBudgetSummary({
          total: 5200000,
          allocated: 4150000,
          remaining: 1050000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetSummary();
  }, [selectedSeason, selectedBrand]);

  return (
    <PlanningContext.Provider
      value={{
        selectedSeason,
        selectedBrand,
        budgetSummary,
        availableSeasons,
        availableBrands,
        setSelectedSeason,
        setSelectedBrand,
        clearContext,
        isLoading,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanningContext() {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanningContext must be used within PlanningContextProvider');
  }
  return context;
}
