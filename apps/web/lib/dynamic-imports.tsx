'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading placeholder component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// Loading skeleton for tables
const TableSkeleton = () => (
  <div className="space-y-3">
    <div className="h-10 bg-muted animate-pulse rounded" />
    <div className="h-10 bg-muted animate-pulse rounded" />
    <div className="h-10 bg-muted animate-pulse rounded" />
    <div className="h-10 bg-muted animate-pulse rounded" />
    <div className="h-10 bg-muted animate-pulse rounded" />
  </div>
);

// ============================================
// CHART COMPONENTS - Heavy, lazy load
// ============================================

export const DynamicAreaChart = dynamic(
  () => import('@/components/charts/area-chart').then((mod) => mod.default || mod.AreaChart),
  { loading: LoadingSpinner, ssr: false }
);

export const DynamicBarChart = dynamic(
  () => import('@/components/charts/bar-chart').then((mod) => mod.default || mod.BarChart),
  { loading: LoadingSpinner, ssr: false }
);

export const DynamicLineChart = dynamic(
  () => import('@/components/charts/line-chart').then((mod) => mod.default || mod.LineChart),
  { loading: LoadingSpinner, ssr: false }
);

export const DynamicHeatmap = dynamic(
  () => import('@/components/charts/heatmap').then((mod) => mod.default || mod.Heatmap),
  { loading: LoadingSpinner, ssr: false }
);

export const DynamicWaterfallChart = dynamic(
  () => import('@/components/charts/waterfall-chart').then((mod) => mod.default || mod.WaterfallChart),
  { loading: LoadingSpinner, ssr: false }
);

export const DynamicForecastChart = dynamic(
  () => import('@/components/charts/forecast-chart').then((mod) => mod.default || mod.ForecastChart),
  { loading: LoadingSpinner, ssr: false }
);

// ============================================
// BUDGET FLOW COMPONENTS
// ============================================

export const DynamicBudgetFlowView = dynamic(
  () => import('@/components/budget-flow/BudgetFlowView').then((mod) => mod.default || mod),
  { loading: LoadingSpinner }
);

export const DynamicVersionHistoryPanel = dynamic(
  () => import('@/components/budget-flow/version-history/VersionHistoryPanel').then((mod) => mod.VersionHistoryPanel),
  { loading: LoadingSpinner }
);

export const DynamicAISuggestionPanel = dynamic(
  () => import('@/components/budget-flow/gap-handling/AISuggestionPanel').then((mod) => mod.AISuggestionPanel),
  { loading: LoadingSpinner }
);

// ============================================
// EXCEL COMPONENTS - Heavy XLSX library
// ============================================

export const DynamicExcelImporter = dynamic(
  () => import('@/components/excel/excel-importer').then((mod) => mod.default || mod.ExcelImporter),
  { loading: LoadingSpinner, ssr: false }
);

export const DynamicImportPreview = dynamic(
  () => import('@/components/excel/import-preview').then((mod) => mod.default || mod.ImportPreview),
  { loading: LoadingSpinner, ssr: false }
);

// ============================================
// TABLE COMPONENTS - Virtualized for large data
// ============================================

export const DynamicDataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.default || mod.DataTable),
  { loading: TableSkeleton }
);

// ============================================
// FEATURE-SPECIFIC HEAVY COMPONENTS
// ============================================

export const DynamicAnalyticsDashboard = dynamic(
  () => import('@/components/analytics').then((mod) => mod.default || mod),
  { loading: LoadingSpinner }
);

export const DynamicDeliveryPlanning = dynamic(
  () => import('@/components/delivery-planning').then((mod) => mod.default || mod),
  { loading: LoadingSpinner }
);

export const DynamicCostingManagement = dynamic(
  () => import('@/components/costing').then((mod) => mod.default || mod),
  { loading: LoadingSpinner }
);

export const DynamicClearanceOptimization = dynamic(
  () => import('@/components/clearance').then((mod) => mod.default || mod),
  { loading: LoadingSpinner }
);
