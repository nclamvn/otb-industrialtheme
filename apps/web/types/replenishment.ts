export type MOCStatus = 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'OVERSTOCK' | 'UNKNOWN';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type ReplenishmentAlertType = 'BELOW_MIN_MOC' | 'APPROACHING_MIN' | 'ABOVE_MAX_MOC' | 'STOCKOUT_RISK' | 'LEAD_TIME_RISK';

export interface MOCData {
  categoryId: string;
  categoryName: string;
  currentStock: number;
  monthlyRate: number;
  currentMOC: number;
  targetMOC: number;
  minMOC: number;
  maxMOC: number;
  status: MOCStatus;
}

export interface ReplenishmentAlert {
  id: string;
  brandId: string;
  categoryId?: string;
  categoryName?: string;
  alertType: ReplenishmentAlertType;
  severity: AlertSeverity;
  currentMOC: number;
  targetMOC: number;
  currentStock: number;
  monthlyRate: number;
  suggestedOrderQty: number;
  suggestedOrderValue: number;
  isAcknowledged: boolean;
  createdAt: string;
}

export interface ReplenishmentDashboardData {
  summary: { totalCategories: number; criticalCount: number; warningCount: number; healthyCount: number };
  mocByCategory: MOCData[];
  alerts: ReplenishmentAlert[];
  pendingOrders: unknown[];
}
