// KPI Types

export type KPICategory = 'SALES' | 'INVENTORY' | 'MARGIN' | 'OPERATIONS' | 'CUSTOMER' | 'FINANCIAL';
export type AggregationType = 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX' | 'WEIGHTED_AVG' | 'CUSTOM';
export type TargetType = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'TARGET_VALUE' | 'RANGE';
export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEASON' | 'YEARLY';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertType = 'THRESHOLD_BREACH' | 'TREND_CHANGE' | 'ANOMALY_DETECTED' | 'TARGET_AT_RISK' | 'FORECAST_DEVIATION';

export interface KPIDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: KPICategory;
  formula: string;
  dataSource: string;
  aggregationType: AggregationType;
  unit?: string;
  format?: string;
  decimals: number;
  targetType: TargetType;
  warningThreshold?: number;
  criticalThreshold?: number;
  isActive: boolean;
  isSystem: boolean;
}

export interface KPITarget {
  id: string;
  kpiId: string;
  seasonId?: string;
  brandId?: string;
  locationId?: string;
  targetValue: number;
  minValue?: number;
  maxValue?: number;
  stretchTarget?: number;
  periodType: PeriodType;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface KPIValue {
  id: string;
  kpiId: string;
  seasonId?: string;
  brandId?: string;
  locationId?: string;
  categoryId?: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  periodType: PeriodType;
  periodDate: Date;
  calculatedAt: Date;
  dataAsOf: Date;
}

export interface KPIAlert {
  id: string;
  kpiId: string;
  kpi?: KPIDefinition;
  alertType: AlertType;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
  seasonId?: string;
  brandId?: string;
  locationId?: string;
  isAcknowledged: boolean;
  acknowledgedById?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface KPIDisplay {
  code: string;
  name: string;
  description?: string;
  formula?: string;
  value: number;
  formattedValue: string;
  unit: string;
  previousValue?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  status: 'on_track' | 'at_risk' | 'off_track' | 'no_target' | 'excellent' | 'good' | 'warning' | 'critical';
  target?: {
    value: number;
    formattedValue?: string;
    type?: string;
  };
  sparklineData?: number[];
  periodLabel?: string;
}

export interface KPIGaugeData {
  value: number;
  min: number;
  max: number;
  target?: number;
  zones: {
    from: number;
    to: number;
    color: string;
  }[];
  status?: 'on_track' | 'at_risk' | 'off_track' | 'no_target' | 'excellent' | 'good' | 'warning' | 'critical';
  label?: string;
  formatValue?: (value: number) => string;
}

// Pre-defined KPI codes
export const KPI_CODES = {
  SELL_THROUGH: 'SELL_THROUGH',
  GROSS_MARGIN: 'GROSS_MARGIN',
  INV_TURN: 'INV_TURN',
  STOCK_SALES: 'STOCK_SALES',
  WOS: 'WOS',
  OTB_UTIL: 'OTB_UTIL',
  SKU_PROD: 'SKU_PROD',
  MARKDOWN: 'MARKDOWN',
} as const;

export type KPICode = typeof KPI_CODES[keyof typeof KPI_CODES];
