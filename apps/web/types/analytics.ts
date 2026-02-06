// Analytics Types

export interface MetricData {
  label: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'neutral';
  target?: number;
  unit?: string;
  sparklineData?: number[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface TimeSeriesData {
  date: string;
  [key: string]: number | string;
}

export interface ComparisonData {
  category: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  label?: string;
}

export interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
}

export interface SankeyNode {
  id: string;
  name: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface WaterfallItem {
  name: string;
  value: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

export interface RadarDataPoint {
  axis: string;
  value: number;
  category?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsFilter {
  dateRange?: DateRange;
  seasonId?: string;
  brandIds?: string[];
  categoryIds?: string[];
  locationIds?: string[];
}

export interface DrillDownContext {
  dimension: string;
  value: string;
  filters: AnalyticsFilter;
}

// Dashboard specific
export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  sparkline?: number[];
  target?: {
    value: number;
    status: 'on_track' | 'at_risk' | 'behind';
  };
}

export interface PerformanceIndicator {
  kpiCode: string;
  name: string;
  currentValue: number;
  targetValue: number;
  achievement: number; // percentage
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: number[];
}
