'use client';

import { useState, useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-5: useAnalytics Hook — Analytics Data Management
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

export interface KPIMetric {
  id: string;
  label: string;
  labelVi: string;
  value: number;
  previousValue: number;
  target?: number;
  format: 'currency' | 'percent' | 'number' | 'units';
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
  sparkline?: number[];
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  margin: number;
  sellThrough: number;
  stockTurn: number;
  weeksOfCover: number;
  otbRemaining: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface SeasonData {
  season: string;
  revenue: number;
  cost: number;
  margin: number;
  units: number;
  sellThrough: number;
  markdownRate: number;
}

export interface ForecastPoint {
  week: string;
  actual: number | null;
  forecast: number;
  upperBound: number;
  lowerBound: number;
}

export interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

export type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'season' | 'custom';

interface UseAnalyticsOptions {
  kpis: KPIMetric[];
  categoryData: CategoryPerformance[];
  seasonData: SeasonData[];
  forecastData: ForecastPoint[];
  trendData: Record<string, TrendPoint[]>;
}

export function useAnalytics({
  kpis,
  categoryData,
  seasonData,
  forecastData,
}: UseAnalyticsOptions) {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedKPI, setSelectedKPI] = useState<string>(kpis[0]?.id || '');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSeason, setCompareSeason] = useState<string | null>(null);

  // ─── Filtered Category Data ────────────────────────────────────────────────
  const filteredCategoryData = useMemo(() => {
    if (selectedCategories.size === 0) return categoryData;
    return categoryData.filter((c) => selectedCategories.has(c.category));
  }, [categoryData, selectedCategories]);

  // ─── KPI Aggregations ──────────────────────────────────────────────────────
  const kpiSummary = useMemo(() => {
    const totalRevenue = categoryData.reduce((sum, c) => sum + c.revenue, 0);
    const avgMargin =
      categoryData.reduce((sum, c) => sum + c.margin, 0) / (categoryData.length || 1);
    const avgSellThrough =
      categoryData.reduce((sum, c) => sum + c.sellThrough, 0) / (categoryData.length || 1);
    const totalOTBRemaining = categoryData.reduce((sum, c) => sum + c.otbRemaining, 0);

    return { totalRevenue, avgMargin, avgSellThrough, totalOTBRemaining };
  }, [categoryData]);

  // ─── Heatmap Data ──────────────────────────────────────────────────────────
  const heatmapData = useMemo(() => {
    return filteredCategoryData.map((cat) => ({
      category: cat.category,
      metrics: [
        { label: 'Revenue', value: cat.revenue, max: Math.max(...categoryData.map((c) => c.revenue)) },
        { label: 'Margin', value: cat.margin, max: 100 },
        { label: 'Sell-through', value: cat.sellThrough, max: 100 },
        { label: 'Stock Turn', value: cat.stockTurn, max: Math.max(...categoryData.map((c) => c.stockTurn)) },
        { label: 'WOC', value: cat.weeksOfCover, max: Math.max(...categoryData.map((c) => c.weeksOfCover)), inverted: true },
      ],
    }));
  }, [filteredCategoryData, categoryData]);

  // ─── Forecast Accuracy ─────────────────────────────────────────────────────
  const forecastAccuracy = useMemo(() => {
    const pointsWithActual = forecastData.filter((p) => p.actual !== null);
    if (pointsWithActual.length === 0) return { mape: 0, bias: 0, accuracy: 0 };

    const totalAbsError = pointsWithActual.reduce(
      (sum, p) => sum + Math.abs((p.actual! - p.forecast) / (p.actual! || 1)),
      0
    );
    const mape = (totalAbsError / pointsWithActual.length) * 100;

    const totalBias = pointsWithActual.reduce(
      (sum, p) => sum + (p.forecast - p.actual!) / (p.actual! || 1),
      0
    );
    const bias = (totalBias / pointsWithActual.length) * 100;

    return {
      mape: Math.round(mape * 10) / 10,
      bias: Math.round(bias * 10) / 10,
      accuracy: Math.round((100 - mape) * 10) / 10,
    };
  }, [forecastData]);

  // ─── Season Comparison ─────────────────────────────────────────────────────
  const seasonComparison = useMemo(() => {
    if (!compareSeason || seasonData.length < 2) return null;
    const current = seasonData[0];
    const compare = seasonData.find((s) => s.season === compareSeason);
    if (!current || !compare) return null;

    return {
      current,
      compare,
      changes: {
        revenue: ((current.revenue - compare.revenue) / compare.revenue) * 100,
        margin: current.margin - compare.margin,
        units: ((current.units - compare.units) / compare.units) * 100,
        sellThrough: current.sellThrough - compare.sellThrough,
      },
    };
  }, [seasonData, compareSeason]);

  // ─── Toggle Category Selection ─────────────────────────────────────────────
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const clearCategoryFilter = useCallback(() => {
    setSelectedCategories(new Set());
  }, []);

  return {
    // State
    dateRange,
    setDateRange,
    selectedCategories,
    toggleCategory,
    clearCategoryFilter,
    selectedKPI,
    setSelectedKPI,
    compareMode,
    setCompareMode,
    compareSeason,
    setCompareSeason,
    // Data
    kpis,
    filteredCategoryData,
    seasonData,
    forecastData,
    // Computed
    kpiSummary,
    heatmapData,
    forecastAccuracy,
    seasonComparison,
  };
}
